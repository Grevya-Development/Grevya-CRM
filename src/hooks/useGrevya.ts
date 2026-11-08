/**
 * useGrevya — Single-instance voice assistant for Grevya CRM.
 * Optimized for AssemblyAI Real-time Transcription (Browser-Local).
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { parseVoiceIntent } from '@/lib/voiceIntentParser';
import { supabase } from '@/supabase/supabaseClient';
import { useCurrency } from '@/hooks/useCurrency';

export type GrevyaStatus =
    | 'sleeping' | 'wake' | 'greeting' | 'listening' | 'processing' | 'speaking' | 'idle';

// AssemblyAI v3 Message Types
interface AAIv3Message {
    type: 'Begin' | 'Turn' | 'PartialTranscript' | 'FinalTranscript' | 'SessionTerminated' | 'Error';
    transcript?: string;
    id?: string;
    message?: string;
}

export interface UseGrevyaReturn {
    status: GrevyaStatus;
    isOverlayOpen: boolean;
    transcript: string;
    response: string;
    isSupported: boolean;
    hasPermission: boolean | null;
    closeOverlay: () => void;
    startListening: () => void;
    triggerQuickCommand: (cmd: string) => void;
}

interface UseGrevyaOptions {
    onNavigate?: (route: string) => void;
    onSearch?: (query: string) => void;
}

// "Grevya" plus common speech-to-text mishearings of it.
const WAKE_WORDS = [
    'grevya', 'hey grevya', 'ok grevya', 'hi grevya', 'hello grevya',
    'grevia', 'greviya', 'grevea', 'grevyah', 'greva', 'grava',
    'gravya', 'gravia', 'graviya', 'grivya', 'grivia', 'greviah',
    'grey via', 'gray via', 'grey vya', 'gray vya', 'grev ya', 'grav ya',
    'grieve ya', 'grieve yah', 'brevia', 'previa',
];

function containsWakeWord(text: string): boolean {
    const lower = text.toLowerCase().trim();

    if (WAKE_WORDS.some((w) => lower.includes(w))) return true;

    // Phonetic fallback: gr/br + e/a/i/ey/ay + v + (i)ya / ia / ea
    return /\b[gb]r(e|a|i|ey|ay)\s?v(i?y|i|e)ah?\b/i.test(lower);
}

export function useGrevya({ onNavigate, onSearch }: UseGrevyaOptions = {}): UseGrevyaReturn {
    const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    const { formatCurrency } = useCurrency();

    const [status, setStatus] = useState<GrevyaStatus>('wake');
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    const modeRef = useRef<'wake' | 'command'>('wake');
    const transcriptRef = useRef('');
    const activeRef = useRef(true);
    const hasGreetedRef = useRef(false);
    const startingRef = useRef(false);
    const restartTimerRef = useRef<any>(null);
    const isSpeakingRef = useRef(false);
    const reconnectTimeoutRef = useRef<any>(null);
    // Timer that auto-closes the idle overlay and returns to wake
    const idleTimerRef = useRef<any>(null);
    // Flag: was the overlay closed manually by the user?
    const manualCloseRef = useRef(false);

    const speak = useCallback((text: string, onDone?: () => void) => {
        if (!window.speechSynthesis) { onDone?.(); return; }
        window.speechSynthesis.cancel();

        isSpeakingRef.current = true;
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 1.1;

        const finish = () => {
            isSpeakingRef.current = false;
            onDone?.();
        };

        utt.onend = finish;
        utt.onerror = finish;
        window.speechSynthesis.speak(utt);
    }, []);

    async function stopRecognition(fullStop = false) {
        startingRef.current = false;
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

        if (socketRef.current) {
            if (socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: 'Terminate' }));
            }
            socketRef.current.onclose = null; // Prevent auto-reconnect
            socketRef.current.close();
            socketRef.current = null;
        }

        if (fullStop) {
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                await audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        }
    }

    function startWake() {
        console.log('[Grevya] Entering Wake Mode');
        modeRef.current = 'wake';
        setStatus('wake');

        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        if (socketRef.current?.readyState !== WebSocket.OPEN && !startingRef.current) {
            startRecognition('wake');
        }
    }

    /**
     * After speaking a response, keep the overlay open in 'idle' mode.
     * If the user stays silent for 8s, auto-return to wake. If they speak,
     * the command mode is already active so their next utterance is processed.
     */
    function enterIdleMode() {
        if (!activeRef.current || manualCloseRef.current) return;
        setStatus('idle');
        modeRef.current = 'command'; // Stay in command mode — ready for follow-up

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (!activeRef.current || manualCloseRef.current) return;
            setIsOverlayOpen(false);
            startWake();
        }, 8000);
    }

    async function processCommand(text: string) {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        const parsed = parseVoiceIntent(text);
        let finalResponse = parsed.response;

        // Handle close intent immediately — no DB query needed
        if (parsed.type === 'close') {
            window.speechSynthesis?.cancel();
            isSpeakingRef.current = false;
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            setIsOverlayOpen(false);
            setTranscript('');
            setResponse('');
            manualCloseRef.current = false;
            startWake();
            return;
        }

        if (parsed.type === 'metric') {
            setStatus('processing');
            try {
                const { data: leads, error } = await supabase
                    .from('crm_leads')
                    .select('estimated_deal_value, lead_stage')
                    .or('is_deleted.eq.false,is_deleted.is.null');

                if (error) throw error;

                if (parsed.metricType === 'total_leads') {
                    finalResponse = `You have ${leads?.length || 0} leads.`;
                } else if (parsed.metricType === 'estimated_deal_value') {
                    const totalValue = (leads || []).reduce((sum, d) => sum + Number(d.estimated_deal_value || 0), 0);
                    finalResponse = `Estimated deal value is ${formatCurrency(totalValue)}.`;
                } else if (parsed.metricType === 'open_pipeline') {
                    const openValue = (leads || [])
                        .filter((d) => !['Won', 'Lost'].includes(d.lead_stage || ''))
                        .reduce((sum, d) => sum + Number(d.estimated_deal_value || 0), 0);
                    finalResponse = `Open pipeline is ${formatCurrency(openValue)}.`;
                } else if (parsed.metricType === 'won_monthly') {
                    const wonValue = (leads || [])
                        .filter((d) => (d.lead_stage || '') === 'Won')
                        .reduce((sum, d) => sum + Number(d.estimated_deal_value || 0), 0);
                    finalResponse = `Won value is ${formatCurrency(wonValue)}.`;
                }
            } catch (err) {
                console.error(err);
                finalResponse = "Couldn't fetch that metric right now.";
            }
        } else if (parsed.type === 'view_record' && parsed.targetName) {
            // Navigate directly to customer detail page
            setStatus('processing');
            try {
                // Search crm_customers first
                const { data: customers, error } = await supabase
                    .from('crm_customers')
                    .select('id, name')
                    .ilike('name', `%${parsed.targetName}%`)
                    .limit(1);

                if (error) throw error;

                if (customers && customers.length > 0) {
                    const customer = customers[0];
                    finalResponse = `Opening ${customer.name}.`;
                    setTimeout(() => {
                        if (!manualCloseRef.current) {
                            onNavigate?.(`/contacts/view/${customer.id}`);
                            setIsOverlayOpen(false);
                        }
                    }, 500);
                } else {
                    // Fallback: search crm_contacts by name
                    const { data: contacts, error: cErr } = await supabase
                        .from('crm_contacts')
                        .select('id, name, customer_id')
                        .ilike('name', `%${parsed.targetName}%`)
                        .limit(1);

                    if (!cErr && contacts && contacts.length > 0) {
                        const contact = contacts[0];
                        const navId = contact.customer_id || contact.id;
                        finalResponse = `Opening ${contact.name}.`;
                        setTimeout(() => {
                            if (!manualCloseRef.current) {
                                onNavigate?.(`/contacts/view/${navId}`);
                                setIsOverlayOpen(false);
                            }
                        }, 500);
                    } else {
                        finalResponse = `Couldn't find a customer named ${parsed.targetName}.`;
                    }
                }
            } catch (err) {
                console.error(err);
                finalResponse = "Couldn't find that customer.";
            }
        } else if (parsed.type === 'lookup_customer' && parsed.targetName) {
            // Fetch customer details from Supabase and speak them
            setStatus('processing');
            try {
                const field = parsed.infoField;

                // Search crm_customers by name
                const { data: customers, error } = await supabase
                    .from('crm_customers')
                    .select('id, name, account_status')
                    .ilike('name', `%${parsed.targetName}%`)
                    .limit(1);

                if (error) throw error;

                if (customers && customers.length > 0) {
                    const c = customers[0];

                    if (field === 'status') {
                        finalResponse = c.account_status
                            ? `${c.name}'s account status is ${c.account_status}.`
                            : `No status found for ${c.name}.`;
                    } else if (field === 'email' || field === 'phone') {
                        // Email/phone is in crm_contacts, linked by customer_id
                        const { data: contacts, error: cErr } = await supabase
                            .from('crm_contacts')
                            .select('name, email, mobile_no, telephone')
                            .eq('customer_id', c.id)
                            .limit(1);

                        if (cErr || !contacts || contacts.length === 0) {
                            finalResponse = `No contact info found for ${c.name}.`;
                        } else {
                            const contact = contacts[0];
                            if (field === 'email') {
                                finalResponse = contact.email
                                    ? `${c.name}'s email is ${contact.email}.`
                                    : `No email found for ${c.name}.`;
                            } else {
                                const phone = contact.mobile_no || contact.telephone;
                                finalResponse = phone
                                    ? `${c.name}'s phone is ${phone}.`
                                    : `No phone number found for ${c.name}.`;
                            }
                        }
                    } else {
                        // General — open their detail page
                        finalResponse = `Opening ${c.name}.`;
                        setTimeout(() => {
                            if (!manualCloseRef.current) {
                                onNavigate?.(`/contacts/view/${c.id}`);
                                setIsOverlayOpen(false);
                            }
                        }, 500);
                    }
                } else {
                    // Fallback: search crm_contacts by name directly
                    const { data: contacts, error: cErr } = await supabase
                        .from('crm_contacts')
                        .select('id, name, email, mobile_no, telephone, customer_id')
                        .ilike('name', `%${parsed.targetName}%`)
                        .limit(1);

                    if (!cErr && contacts && contacts.length > 0) {
                        const contact = contacts[0];
                        if (field === 'email') {
                            finalResponse = contact.email
                                ? `${contact.name}'s email is ${contact.email}.`
                                : `No email found for ${contact.name}.`;
                        } else if (field === 'phone') {
                            const phone = contact.mobile_no || contact.telephone;
                            finalResponse = phone
                                ? `${contact.name}'s phone is ${phone}.`
                                : `No phone number found for ${contact.name}.`;
                        } else {
                            const navId = contact.customer_id || contact.id;
                            finalResponse = `Opening ${contact.name}.`;
                            setTimeout(() => {
                                if (!manualCloseRef.current) {
                                    onNavigate?.(`/contacts/view/${navId}`);
                                    setIsOverlayOpen(false);
                                }
                            }, 500);
                        }
                    } else {
                        finalResponse = `Couldn't find anyone named ${parsed.targetName}.`;
                    }
                }
            } catch (err) {
                console.error(err);
                finalResponse = "Couldn't look that up right now.";
            }
        }

        setResponse(finalResponse);
        setTranscript(text);
        setStatus('speaking');

        if ((parsed.type === 'navigate' || parsed.type === 'create') && parsed.route) {
            setTimeout(() => {
                if (!manualCloseRef.current) onNavigate?.(parsed.route!);
            }, 500);
        } else if (parsed.type === 'search' && parsed.searchQuery) {
            setTimeout(() => {
                if (!manualCloseRef.current) {
                    onSearch?.(parsed.searchQuery!);
                    setIsOverlayOpen(false);
                }
            }, 500);
        }

        speak(finalResponse, () => {
            if (!activeRef.current || manualCloseRef.current) return;
            // Stay open in idle mode so user can continue
            enterIdleMode();
        });
    }

    async function startRecognition(initialMode: 'wake' | 'command') {
        if (!isSupported || startingRef.current) return;
        if (socketRef.current) await stopRecognition();

        startingRef.current = true;
        modeRef.current = initialMode;

        try {
            const apiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
            if (!apiKey) throw new Error('AssemblyAI API Key missing in .env');

            let stream = streamRef.current;
            if (!stream || !stream.active) {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 16000
                    }
                });
                streamRef.current = stream;
            }
            setHasPermission(true);

            const encodedWordBoost = encodeURIComponent(JSON.stringify(WAKE_WORDS));
            const url = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&token=${apiKey}&speech_model=u3-rt-pro&word_boost=${encodedWordBoost}`;

            const socket = new WebSocket(url);
            socketRef.current = socket;
            socket.binaryType = 'arraybuffer';

            socket.onopen = () => {
                console.log('[Grevya] v3 Session Connected');
                startingRef.current = false;
                if (modeRef.current === 'command') setStatus('listening');
                else setStatus('wake');
            };

            socket.onmessage = (message) => {
                const res = JSON.parse(message.data) as AAIv3Message;
                if (res.type === 'Begin') return;
                if (res.type === 'Error') {
                    console.error('[Grevya] v3 Service Error:', res.message);
                    return;
                }

                if (res.type === 'Turn' || res.type === 'FinalTranscript' || res.type === 'PartialTranscript') {
                    const text = res.transcript || '';
                    if (!text || isSpeakingRef.current) return;

                    if (modeRef.current === 'wake') {
                        console.log('[Grevya] Wake mode transcript:', text);
                        if (containsWakeWord(text)) {
                            console.log('[Grevya] Wake word detected!');
                            modeRef.current = 'command';
                            manualCloseRef.current = false;

                            setIsOverlayOpen(true);
                            setTranscript('');
                            setResponse('');
                            transcriptRef.current = '';
                            if (!hasGreetedRef.current) {
                                hasGreetedRef.current = true;
                                setStatus('greeting');
                                speak('Hi, how can I help?', () => {
                                    if (activeRef.current && !manualCloseRef.current) setStatus('listening');
                                });
                            } else {
                                setStatus('listening');
                            }
                        }
                    } else if (res.type === 'Turn' || res.type === 'FinalTranscript') {
                        setTranscript(text);
                        transcriptRef.current = text;
                        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                        // Reset idle timer if user is speaking
                        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
                        restartTimerRef.current = setTimeout(() => {
                            if (modeRef.current === 'command' && transcriptRef.current && !isSpeakingRef.current) {
                                processCommand(transcriptRef.current);
                            }
                        }, 800); // Reduced from 1500ms → 800ms
                    } else if (res.type === 'PartialTranscript') {
                        setTranscript(text);
                        transcriptRef.current = text;
                        // Cancel idle timer when user starts speaking again
                        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
                    }
                }
            };

            socket.onclose = (e) => {
                console.log('[Grevya] Socket Closed:', e.code, e.reason);
                if (activeRef.current && !startingRef.current && !manualCloseRef.current) {
                    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (activeRef.current && !manualCloseRef.current) startRecognition(modeRef.current);
                    }, 300); // Reduced from 1000ms → 300ms
                }
            };

            socket.onerror = (err) => {
                console.error('[Grevya] Socket Error:', err);
            };

            // Audio processing setup (Reused if possible)
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
                const source = audioContextRef.current.createMediaStreamSource(stream);
                const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                source.connect(processor);
                processor.connect(audioContextRef.current.destination);

                processor.onaudioprocess = (e) => {
                    const currentSocket = socketRef.current;
                    if (!currentSocket || currentSocket.readyState !== WebSocket.OPEN || isSpeakingRef.current) return;
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                    }
                    currentSocket.send(pcmData.buffer);
                };
            }

        } catch (err) {
            startingRef.current = false;
            setHasPermission(false);
            setStatus('sleeping');
        }
    }

    /**
     * closeOverlay — Called when user manually clicks X or presses Escape.
     * Immediately stops speech synthesis, cancels all timers, and returns to wake mode silently.
     */
    const closeOverlay = useCallback(() => {
        manualCloseRef.current = true;

        // Stop any ongoing speech immediately
        window.speechSynthesis?.cancel();
        isSpeakingRef.current = false;

        // Cancel all pending timers
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

        setIsOverlayOpen(false);
        setTranscript('');
        setResponse('');

        // Re-enter wake mode (without speaking)
        manualCloseRef.current = false; // reset so reconnect works
        startWake();
    }, []);

    const startListening = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        manualCloseRef.current = false;
        setTranscript('');
        setResponse('');
        transcriptRef.current = '';
        modeRef.current = 'command';
        setStatus('listening');
    }, []);

    const triggerQuickCommand = useCallback((cmd: string) => {
        transcriptRef.current = cmd;
        setTranscript(cmd);
        processCommand(cmd);
    }, []);

    useEffect(() => {
        activeRef.current = true;
        // Start immediately — no artificial delay
        startWake();
        return () => {
            activeRef.current = false;
            stopRecognition();
            window.speechSynthesis?.cancel();
        };
    }, []);

    return {
        status, isOverlayOpen, transcript, response, isSupported,
        hasPermission, closeOverlay, startListening, triggerQuickCommand,
    };
}
