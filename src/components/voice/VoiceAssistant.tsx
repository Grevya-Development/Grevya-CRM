/**
 * GrevyaBar — Siri/Google Assistant style floating bar.
 *
 * Appears at the bottom-center of the screen when Grevya is active.
 * Non-blocking — the rest of the app remains fully visible and usable.
 * Shows a pulsing orb + live transcript in compact pill form.
 */
import { useEffect, useRef } from 'react';
import { X, Mic } from 'lucide-react';
import { GrevyaStatus } from '@/hooks/useGrevya';
import { cn } from '@/lib/utils';

interface VoiceAssistantProps {
    isOpen: boolean;
    status: GrevyaStatus;
    transcript: string;
    response: string;
    isSupported: boolean;
    hasPermission: boolean | null;
    onClose: () => void;
    onStartListening: () => void;
    onQuickCommand: (cmd: string) => void;
}

/* Siri-style animated waveform bars */
function SiriWave({ active }: { active: boolean }) {
    const heights = [0.4, 0.7, 1, 0.85, 0.6, 0.9, 0.5, 0.75, 0.45];
    return (
        <div className="flex items-center gap-[3px] h-7">
            {heights.map((h, i) => (
                <div
                    key={i}
                    className={cn(
                        'w-[3px] rounded-full transition-all duration-300',
                        active
                            ? 'bg-gradient-to-t from-violet-500 to-purple-300 voice-wave-bar'
                            : 'bg-violet-500/30',
                    )}
                    style={{
                        height: active ? `${h * 26}px` : '4px',
                        animationDelay: active ? `${i * 0.08}s` : '0s',
                    }}
                />
            ))}
        </div>
    );
}

/* Google-assistant style pulsing orb */
function GrevyaOrb({ status }: { status: GrevyaStatus }) {
    const isListening = status === 'listening';
    const isSpeaking = status === 'speaking';
    const isGreeting = status === 'greeting';
    const isProcessing = status === 'processing';
    const isIdle = status === 'idle';

    return (
        <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
            {/* Outer pulse ring */}
            {(isListening || isGreeting) && (
                <>
                    <div className="absolute inset-0 rounded-full border-2 border-violet-400/40 animate-ping"
                        style={{ animationDuration: '1.2s' }} />
                    <div className="absolute inset-[-4px] rounded-full border border-violet-400/20 animate-ping"
                        style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
                </>
            )}
            {/* Core orb */}
            <div
                className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500',
                    isListening
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.7)] scale-110'
                        : isSpeaking
                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_16px_rgba(99,102,241,0.6)]'
                            : isGreeting
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_0_16px_rgba(139,92,246,0.5)]'
                                : isProcessing
                                    ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                                    : isIdle
                                        ? 'bg-gradient-to-br from-violet-800 to-purple-900 opacity-70'
                                        : 'bg-gradient-to-br from-violet-700 to-purple-800',
                )}
            >
                {/* Custom icon */}
                <img src="/favicon.png" alt="Grevya" className="w-5 h-5 object-contain select-none" />
            </div>
        </div>
    );
}

export function VoiceAssistant({
    isOpen,
    status,
    transcript,
    response,
    isSupported,
    hasPermission,
    onClose,
    onStartListening,
}: VoiceAssistantProps) {
    const barRef = useRef<HTMLDivElement>(null);

    // ESC to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isListening = status === 'listening';
    const isSpeaking = status === 'speaking';
    const isIdle = status === 'idle';
    const isWaveActive = isListening || isSpeaking;
    const displayText = transcript || response || getStatusText(status);

    return (
        /* No backdrop — app remains fully visible */
        <div
            ref={barRef}
            className="fixed bottom-8 left-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none"
            style={{ transform: 'translateX(-50%)' }}
            aria-live="polite"
            aria-label="Grevya Voice Assistant"
        >
            {/* Response bubble — appears above the bar */}
            {response && (
                <div
                    className="pointer-events-auto px-4 py-2 rounded-2xl text-center max-w-sm animate-fade-in"
                    style={{
                        background: 'rgba(20,14,42,0.92)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(16px)',
                    }}
                >
                    <p className="text-white/80 text-sm leading-snug font-medium">{response}</p>
                </div>
            )}

            {/* Continue button — shown when in idle state after speaking */}
            {isIdle && (
                <button
                    onClick={onStartListening}
                    className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-violet-300 hover:text-white transition-all animate-fade-in"
                    style={{
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.35)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <Mic className="w-3 h-3" />
                    Continue
                </button>
            )}

            {/* Main floating bar */}
            <div
                className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[100px]"
                style={{
                    background: 'rgba(14,10,30,0.92)',
                    border: '1px solid rgba(139,92,246,0.30)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08)',
                    backdropFilter: 'blur(20px)',
                    minWidth: '280px',
                    maxWidth: '420px',
                }}
            >
                {/* Animated orb */}
                <GrevyaOrb status={status} />

                {/* Live transcript / status text */}
                <div className="flex-1 min-w-0">
                    <p
                        className={cn(
                            'text-sm font-medium truncate leading-tight transition-all duration-300',
                            transcript ? 'text-white' : 'text-white/40',
                        )}
                    >
                        {displayText}
                    </p>
                    {isIdle && (
                        <p className="text-[11px] text-violet-400/50 leading-tight mt-0.5">
                            Say another command or close
                        </p>
                    )}
                </div>

                {/* Waveform */}
                <SiriWave active={isWaveActive} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all ml-1"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Mic denied warning */}
            {(!isSupported || hasPermission === false) && (
                <div
                    className="pointer-events-auto px-3 py-1.5 rounded-2xl"
                    style={{
                        background: 'rgba(245,158,11,0.10)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <p className="text-amber-300 text-xs">
                        {!isSupported ? 'Voice needs Chrome or Edge.' : 'Mic access denied.'}
                    </p>
                </div>
            )}
        </div>
    );
}

function getStatusText(status: GrevyaStatus): string {
    switch (status) {
        case 'greeting': return 'Grevya is waking up…';
        case 'listening': return 'Listening…';
        case 'processing': return 'Thinking…';
        case 'speaking': return 'Speaking…';
        case 'idle': return 'Ready for more…';
        default: return 'Grevya';
    }
}
