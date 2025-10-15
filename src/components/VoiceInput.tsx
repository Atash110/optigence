import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square } from 'lucide-react';

interface VoiceInputProps {
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
  onTranscript: (transcript: string) => void;
  isDarkMode: boolean;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      isFinal: boolean;
      [key: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  isRecording, 
  onRecordingChange, 
  onTranscript, 
  isDarkMode 
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const windowWithSpeech = window as {
      SpeechRecognition?: new() => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new() => SpeechRecognitionInstance;
    };
    const SpeechRecognitionClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    
    if (SpeechRecognitionClass) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognitionClass();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => {
        console.log('Voice recognition started');
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const currentTranscript = result[0].transcript;
            console.log('Final transcript:', currentTranscript);
            onTranscript(currentTranscript);
            onRecordingChange(false);
          }
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        onRecordingChange(false);
      };

      recognitionInstance.onend = () => {
        console.log('Voice recognition ended');
        onRecordingChange(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported in this browser.');
      setIsSupported(false);
    }
  }, [onRecordingChange, onTranscript]);

  const handleToggleRecording = () => {
    if (!isSupported || !recognition) return;

    if (isRecording) {
      recognition.stop();
      onRecordingChange(false);
    } else {
      try {
        recognition.start();
        onRecordingChange(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        onRecordingChange(false);
      }
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className={`p-3 rounded-xl opacity-50 cursor-not-allowed ${
          isDarkMode 
            ? 'bg-optimail-navy-light/30 text-optimail-muted' 
            : 'bg-gray-200 text-gray-400'
        }`}
        title="Voice input not supported"
      >
        <Mic size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleRecording}
      className={`p-3 rounded-xl transition-all duration-200 relative ${
        isRecording
          ? 'bg-red-500 text-white hover:bg-red-600'
          : isDarkMode
          ? 'bg-optimail-navy-light/40 text-optimail-light hover:bg-optimail-navy-light/60'
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
      }`}
      title={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isRecording ? (
        <>
          <Square size={20} />
          {/* Pulse animation */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-red-400"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </>
      ) : (
        <Mic size={20} />
      )}
    </button>
  );
};

export default VoiceInput;
