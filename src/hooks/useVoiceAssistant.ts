import { useState, useCallback, useRef, useEffect } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceAssistantState {
    voiceState: VoiceState;
    transcript: string;
    response: string;
    error: string | null;
    isSupported: boolean;
}

export interface UseVoiceAssistantReturn extends VoiceAssistantState {
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string) => void;
    setResponse: (response: string) => void;
    reset: () => void;
}

// Browser speech API types
type AnyRecognition = any;


export function useVoiceAssistant(
    onCommand?: (transcript: string) => Promise<string> | string
): UseVoiceAssistantReturn {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<AnyRecognition>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const transcriptRef = useRef<string>('');

    const isSupported =
        typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
        'speechSynthesis' in window;

    useEffect(() => {
        if (!isSupported) return;
        synthRef.current = window.speechSynthesis;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [isSupported]);

    const speak = useCallback((text: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to use a natural-sounding voice
        const voices = synthRef.current.getVoices();
        const preferredVoice =
            voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
            voices.find((v) => v.lang.startsWith('en-US')) ||
            voices.find((v) => v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setVoiceState('speaking');
        utterance.onend = () => setVoiceState('idle');
        utterance.onerror = () => setVoiceState('idle');

        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
        setVoiceState('speaking');
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        setError(null);
        setTranscript('');
        setResponse('');

        // Cancel any ongoing speech
        if (synthRef.current) {
            synthRef.current.cancel();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        const SpeechRecognitionImpl = w.SpeechRecognition || w.webkitSpeechRecognition;

        const recognition = new SpeechRecognitionImpl();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setVoiceState('listening');
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            const live = finalTranscript || interimTranscript;
            transcriptRef.current = live;
            setTranscript(live);
        };

        recognition.onend = async () => {
            setVoiceState('processing');
            const finalText = transcriptRef.current;

            if (finalText.trim() && onCommand) {
                try {
                    const result = await onCommand(finalText.trim());
                    setResponse(result);
                    speak(result);
                } catch {
                    const errMsg = 'Sorry, I encountered an error processing your command.';
                    setResponse(errMsg);
                    speak(errMsg);
                }
            } else if (!finalText.trim()) {
                setVoiceState('idle');
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                setVoiceState('idle');
                return;
            }
            if (event.error === 'not-allowed') {
                setError('Microphone access was denied. Please allow microphone access and try again.');
            } else {
                setError(`Voice recognition error: ${event.error}`);
            }
            setVoiceState('idle');
        };

        recognitionRef.current = recognition;
        transcriptRef.current = '';
        recognition.start();
    }, [isSupported, onCommand, speak]);

    const reset = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        setVoiceState('idle');
        setTranscript('');
        setResponse('');
        setError(null);
    }, []);

    return {
        voiceState,
        transcript,
        response,
        error,
        isSupported,
        startListening,
        stopListening,
        speak,
        setResponse,
        reset,
    };
}
