import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Command } from 'lucide-react';
import voiceToActionService, { ActionResult, VoiceContext } from '@/lib/voice-to-action';

interface VoiceCommandsProps {
  isDarkMode: boolean;
  isVisible: boolean;
  onAction: (result: ActionResult) => void;
  voiceContext?: VoiceContext;
}

const VoiceCommands: React.FC<VoiceCommandsProps> = ({
  isDarkMode,
  isVisible,
  onAction,
  voiceContext
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableCommands, setAvailableCommands] = useState<string[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load available commands
    const commands = voiceToActionService.getAvailableCommands();
    setAvailableCommands(commands.map(cmd => cmd.examples[0]));
  }, []);

  const startListening = async () => {
    try {
      setError('');
      
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition not supported in this browser');
      }
      
      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        throw new Error('Microphone access denied. Please enable microphone permissions in your browser settings.');
      }
      
      setIsListening(true);
      const transcript = await voiceToActionService.startListening();
      setTranscript(transcript);
      await processCommand(transcript);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Voice recognition failed');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    voiceToActionService.stopListening();
    setIsListening(false);
  };

  const processCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await voiceToActionService.processVoiceCommand(command, voiceContext);
      setLastAction(result);
      onAction(result);
      
      if (result.success) {
        // Speak the result if supported
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(result.message);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      const errorResult: ActionResult = {
        success: false,
        message: 'Failed to process voice command',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastAction(errorResult);
      onAction(errorResult);
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  const handleManualCommand = async (command: string) => {
    setTranscript(command);
    await processCommand(command);
  };

  const clearTranscript = () => {
    setTranscript('');
    setLastAction(null);
    setError('');
  };

  if (!isVisible) return null;

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-optimail-navy border-optimail-bright-blue/20' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Command size={20} className={isDarkMode ? 'text-optimail-bright-blue' : 'text-blue-600'} />
          <h3 className={`font-semibold ${isDarkMode ? 'text-optimail-light' : 'text-gray-800'}`}>
            Voice Commands
          </h3>
        </div>
        
        <button
          onClick={() => setShowCommands(!showCommands)}
          className={`text-sm px-2 py-1 rounded transition-colors ${
            isDarkMode
              ? 'text-optimail-muted hover:text-optimail-light'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          title="Toggle command list"
        >
          {showCommands ? 'Hide' : 'Show'} Commands
        </button>
      </div>

      {/* Voice Control */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isListening
              ? isDarkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
              : isDarkMode
                ? 'bg-optimail-bright-blue hover:bg-optimail-bright-blue/80 text-optimail-navy'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>

        {isProcessing && (
          <div className={`text-sm ${isDarkMode ? 'text-optimail-muted' : 'text-gray-600'}`}>
            Processing command...
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-optimail-light' : 'text-gray-800'}`}>
              Voice Input:
            </span>
            <button
              onClick={clearTranscript}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                isDarkMode
                  ? 'text-optimail-muted hover:text-optimail-light'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Clear
            </button>
          </div>
          <div className={`p-3 rounded-lg border ${
            isDarkMode
              ? 'bg-optimail-navy-light border-optimail-bright-blue/20 text-optimail-light'
              : 'bg-gray-50 border-gray-200 text-gray-800'
          }`}>
            {transcript}
          </div>
        </div>
      )}

      {/* Last Action Result */}
      {lastAction && (
        <div className="mb-4">
          <div className={`p-3 rounded-lg border ${
            lastAction.success
              ? isDarkMode
                ? 'bg-green-900/20 border-green-500/30 text-green-300'
                : 'bg-green-50 border-green-200 text-green-800'
              : isDarkMode
                ? 'bg-red-900/20 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${
                lastAction.success ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-medium text-sm">
                {lastAction.success ? 'Success' : 'Error'}
              </span>
            </div>
            <p className="text-sm">{lastAction.message}</p>
            {lastAction.error && (
              <p className="text-xs mt-1 opacity-75">{lastAction.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Available Commands */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`border-t pt-4 ${isDarkMode ? 'border-optimail-bright-blue/20' : 'border-gray-200'}`}>
              <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-optimail-light' : 'text-gray-800'}`}>
                Available Commands:
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableCommands.slice(0, 10).map((command, index) => (
                  <button
                    key={index}
                    onClick={() => handleManualCommand(command)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode
                        ? 'text-optimail-muted hover:bg-optimail-navy-light hover:text-optimail-light'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    {command}
                  </button>
                ))}
                {availableCommands.length > 10 && (
                  <p className={`text-xs px-3 py-2 ${isDarkMode ? 'text-optimail-muted' : 'text-gray-500'}`}>
                    +{availableCommands.length - 10} more commands available
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleManualCommand('help')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-optimail-navy-light text-optimail-muted hover:text-optimail-light'
              : 'bg-gray-100 text-gray-600 hover:text-gray-800'
          }`}
        >
          Help
        </button>
        <button
          onClick={() => handleManualCommand('compose email')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-optimail-navy-light text-optimail-muted hover:text-optimail-light'
              : 'bg-gray-100 text-gray-600 hover:text-gray-800'
          }`}
        >
          Compose
        </button>
        <button
          onClick={() => handleManualCommand('check calendar')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-optimail-navy-light text-optimail-muted hover:text-optimail-light'
              : 'bg-gray-100 text-gray-600 hover:text-gray-800'
          }`}
        >
          Calendar
        </button>
      </div>
    </div>
  );
};

export default VoiceCommands;
