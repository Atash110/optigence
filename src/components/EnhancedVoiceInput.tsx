import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Settings, BarChart3 } from 'lucide-react';
import VoiceEnhancementService, { VoiceConfig, VoiceResult } from '@/lib/voice';

interface EnhancedVoiceInputProps {
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
  onTranscript: (transcript: string) => void;
  onVoiceResult?: (result: VoiceResult) => void;
  className?: string;
  voiceConfig?: VoiceConfig;
  showProviderSelection?: boolean;
}

export default function EnhancedVoiceInput({
  isRecording,
  onRecordingChange,
  onTranscript,
  onVoiceResult,
  className = '',
  voiceConfig,
  showProviderSelection = true,
}: EnhancedVoiceInputProps) {
  const [voiceService] = useState(() => new VoiceEnhancementService());
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<'openai' | 'deepgram' | 'browser'>('openai');
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkMicrophonePermission = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setHasPermission(permissionStatus.state === 'granted');
        
        permissionStatus.addEventListener('change', () => {
          setHasPermission(permissionStatus.state === 'granted');
          setPermissionError(null);
        });
      } else {
        // Fallback: try to access microphone to check permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
        } catch {
          setHasPermission(false);
        }
      }
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      setHasPermission(null);
    }
  }, []);

  // Check microphone permission on component mount
  React.useEffect(() => {
    checkMicrophonePermission();
  }, [checkMicrophonePermission]);

  // Audio level animation (simulated)
  React.useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
        setDuration(prev => prev + 0.1);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setDuration(0);
      setAudioLevel(0);
    }
  }, [isRecording]);

  const handleToggleRecording = useCallback(async () => {
    if (isProcessing) return;

    // Check permission first
    if (hasPermission === false) {
      setPermissionError('Microphone access denied. Please check your browser settings and allow microphone access for this site.');
      return;
    }

    if (!isRecording) {
      try {
        setIsProcessing(true);
        
        // Check permission one more time before starting
        if (!(await checkMicrophonePermission())) {
          setPermissionError('Microphone access is required for voice input. Please allow microphone access and try again.');
          return;
        }

        const result = await voiceService.startRecording({
          provider: currentProvider,
          ...voiceConfig
        });
        
        if (result.success) {
          onRecordingChange(true);
          setPermissionError(null);
        } else {
          throw new Error(result.error || 'Failed to start recording');
        }
      } catch (error: any) {
        console.error('Recording start error:', error);
        
        if (error.name === 'NotAllowedError') {
          setPermissionError('Microphone access denied. Please refresh the page and allow microphone access when prompted.');
        } else if (error.name === 'NotFoundError') {
          setPermissionError('No microphone found. Please connect a microphone and try again.');
        } else {
          setPermissionError('Unable to start recording: ' + (error.message || 'Unknown error'));
        }
      } finally {
        setIsProcessing(false);
      }
    } else {
      try {
        setIsProcessing(true);
        const result = await voiceService.stopRecording();
        
        if (result.success && result.transcript) {
          onTranscript(result.transcript);
          if (onVoiceResult && result) {
            onVoiceResult(result);
          }
        }
        
        onRecordingChange(false);
        setPermissionError(null);
      } catch (error: any) {
        console.error('Recording stop error:', error);
        setPermissionError('Error processing recording: ' + (error.message || 'Unknown error'));
      } finally {
        setIsProcessing(false);
      }
    }
  }, [isRecording, isProcessing, voiceService, onRecordingChange, onTranscript, onVoiceResult, hasPermission, checkMicrophonePermission, currentProvider, voiceConfig]);

  const handleProviderChange = useCallback((provider: 'openai' | 'deepgram' | 'browser') => {
    setCurrentProvider(provider);
    
    // Update voice service configuration
    voiceService.updateConfig({
      provider,
      ...voiceConfig
    });
  }, [voiceService, voiceConfig]);

  const formatDuration = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(0).padStart(2, '0')}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Permission Error Message */}
      <AnimatePresence>
        {permissionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm"
          >
            {permissionError}
            <button
              onClick={() => setPermissionError(null)}
              className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {/* Main Recording Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleRecording}
          disabled={isProcessing || hasPermission === false}
          className={`
            relative flex items-center justify-center w-16 h-16 rounded-full
            transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
          
          {/* Audio Level Visualization */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-red-300"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.3, 0.7],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.button>

        {/* Duration Display */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                {formatDuration(duration)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Button */}
        {showProviderSelection && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        )}

        {/* Audio Level Bars */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-1"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full"
                  animate={{
                    height: [4, Math.random() * 20 + 4, 4],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Voice Provider
              </h3>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(['openai', 'deepgram', 'browser'] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() => handleProviderChange(provider)}
                  className={`
                    px-3 py-2 text-xs rounded-md transition-colors capitalize
                    ${currentProvider === provider
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {provider}
                </button>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Current: <span className="capitalize font-medium">{currentProvider}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
