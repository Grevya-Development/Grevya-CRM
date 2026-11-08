import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface VoiceField {
  field: string;
  prompt: string;
  label: string;
}

interface UseGuidedVoiceInputReturn {
  isListening: boolean;
  currentField: string | null;
  transcript: string;
  isSpeaking: boolean;
  startGuidedInput: (fields: VoiceField[]) => void;
  stopGuidedInput: () => void;
  skipField: () => void;
  isSupported: boolean;
  fieldValues: Record<string, string>;
  progress: { current: number; total: number };
}

export const useGuidedVoiceInput = (): UseGuidedVoiceInputReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<VoiceField[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      synthRef.current.speak(utterance);
    });
  }, []);

  const startListeningForField = useCallback(async (field: VoiceField) => {
    if (!isSupported) return;

    setCurrentField(field.field);
    setTranscript('');
    
    // Speak the prompt
    await speak(field.prompt);
    
    // Start listening
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = transcriptPart;
        } else {
          interimTranscript = transcriptPart;
        }
      }
      
      setTranscript(interimTranscript || finalTranscript);
      
      if (finalTranscript) {
        setFieldValues(prev => ({
          ...prev,
          [field.field]: finalTranscript.trim(),
        }));
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
    toast.info(`Listening for ${field.label}...`);
  }, [isSupported, speak]);

  const moveToNextField = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < fields.length) {
      setCurrentIndex(nextIndex);
      setTimeout(() => startListeningForField(fields[nextIndex]), 500);
    } else {
      // All fields complete
      setIsListening(false);
      setCurrentField(null);
      speak('All fields captured successfully. Please review and submit.');
      toast.success('Voice input complete!');
    }
  }, [currentIndex, fields, startListeningForField, speak]);

  const startGuidedInput = useCallback((fieldList: VoiceField[]) => {
    if (!isSupported) {
      toast.error('Voice input is not supported in this browser');
      return;
    }

    setFields(fieldList);
    setCurrentIndex(0);
    setFieldValues({});
    
    speak('Starting guided voice input. I will prompt you for each field.').then(() => {
      if (fieldList.length > 0) {
        startListeningForField(fieldList[0]);
      }
    });
  }, [isSupported, speak, startListeningForField]);

  const stopGuidedInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentField(null);
    setFields([]);
    setCurrentIndex(0);
  }, []);

  const skipField = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    moveToNextField();
  }, [moveToNextField]);

  // Auto-advance after capturing a field
  useEffect(() => {
    if (!isListening && currentField && fields.length > 0 && fieldValues[currentField]) {
      const timer = setTimeout(() => {
        moveToNextField();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isListening, currentField, fields, fieldValues, moveToNextField]);

  return {
    isListening,
    currentField,
    transcript,
    isSpeaking,
    startGuidedInput,
    stopGuidedInput,
    skipField,
    isSupported,
    fieldValues,
    progress: { current: currentIndex + 1, total: fields.length },
  };
};

export default useGuidedVoiceInput;
