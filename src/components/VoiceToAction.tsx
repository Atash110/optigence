/**
 * VoiceToAction Component - Complete Voice-to-Email Pipeline
 * Records audio, transcribes, detects intent, extracts entities, and generates email drafts
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MicrophoneIcon, StopIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface VoiceTranscriptionResult {
  transcript: string;
  confidence: number;
  language?: string;
}

interface IntentResult {
  intent: string;
  confidence: number;
  alternatives: Array<{ intent: string; confidence: number }>;
}

interface EntityResult {
  people: string[];
  dates: string[];
  locations: string[];
  topics: string[];
  sentiment: string;
  urgency: string;
  actionItems: string[];
}

interface EmailDraft {
  subject: string;
  body: string;
  tone: string;
  alternatives: Array<{
    subject: string;
    body: string;
    tone: string;
  }>;
}

export default function VoiceToAction() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [intent, setIntent] = useState<IntentResult | null>(null);
  const [entities, setEntities] = useState<EntityResult | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'idle' | 'recording' | 'transcribing' | 'analyzing' | 'drafting' | 'complete'>('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError('');
      setStep('recording');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudio();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please ensure you have granted permission.');
      setStep('idle');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      setError('No audio data recorded');
      setStep('idle');
      return;
    }

    setIsProcessing(true);
    setStep('transcribing');

    try {
      // 1. Create audio blob and upload for transcription
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/asr/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error(`Transcription failed: ${transcribeResponse.status}`);
      }

      const transcriptionResult: VoiceTranscriptionResult = await transcribeResponse.json();
      setTranscript(transcriptionResult.transcript);

      if (!transcriptionResult.transcript.trim()) {
        throw new Error('No speech detected in the recording');
      }

      // 2. Detect intent
      setStep('analyzing');
      const intentResponse = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptionResult.transcript }),
      });

      if (!intentResponse.ok) {
        throw new Error(`Intent detection failed: ${intentResponse.status}`);
      }

      const intentResult: IntentResult = await intentResponse.json();
      setIntent(intentResult);

      // 3. Extract entities
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptionResult.transcript }),
      });

      if (!extractResponse.ok) {
        throw new Error(`Entity extraction failed: ${extractResponse.status}`);
      }

      const entitiesResult: EntityResult = await extractResponse.json();
      setEntities(entitiesResult);

      // 4. Generate email draft
      setStep('drafting');
      const draftResponse = await fetch('/api/llm/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: intentResult.intent,
          entities: entitiesResult,
          context: {
            userPreferences: {},
            conversationHistory: []
          }
        }),
      });

      if (!draftResponse.ok) {
        throw new Error(`Draft generation failed: ${draftResponse.status}`);
      }

      const draftResult: EmailDraft = await draftResponse.json();
      setEmailDraft(draftResult);
      setStep('complete');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStep('idle');
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSession = () => {
    setTranscript('');
    setIntent(null);
    setEntities(null);
    setEmailDraft(null);
    setError('');
    setStep('idle');
    audioChunksRef.current = [];
  };

  const getStepStatus = (currentStep: string) => {
    const steps = ['recording', 'transcribing', 'analyzing', 'drafting', 'complete'];
    const currentIndex = steps.indexOf(step);
    const stepIndex = steps.indexOf(currentStep);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice to Email</h1>
        <p className="text-gray-600">Speak naturally to create professional emails</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { key: 'recording', label: 'Record', icon: MicrophoneIcon },
            { key: 'transcribing', label: 'Transcribe', icon: null },
            { key: 'analyzing', label: 'Analyze', icon: null },
            { key: 'drafting', label: 'Draft', icon: PaperAirplaneIcon },
            { key: 'complete', label: 'Complete', icon: null }
          ].map((stepItem, index) => {
            const status = getStepStatus(stepItem.key);
            return (
              <div key={stepItem.key} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  status === 'complete' ? 'bg-green-500 text-white' :
                  status === 'active' ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {stepItem.icon && <stepItem.icon className="w-5 h-5" />}
                  {!stepItem.icon && <span>{index + 1}</span>}
                </div>
                <span className={`text-sm ${
                  status === 'active' ? 'text-blue-600 font-medium' : 'text-gray-600'
                }`}>
                  {stepItem.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recording Controls */}
      <div className="text-center mb-8">
        {!isRecording && !isProcessing && (
          <button
            onClick={startRecording}
            title="Start recording"
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <MicrophoneIcon className="w-8 h-8" />
          </button>
        )}
        
        {isRecording && (
          <button
            onClick={stopRecording}
            title="Stop recording"
            className="bg-red-600 text-white rounded-full p-6 shadow-lg animate-pulse"
          >
            <StopIcon className="w-8 h-8" />
          </button>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-blue-600">
              {step === 'transcribing' && 'Converting speech to text...'}
              {step === 'analyzing' && 'Understanding your intent...'}
              {step === 'drafting' && 'Crafting your email...'}
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <button
            onClick={resetSession}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results Display */}
      {transcript && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Transcription</h3>
          <div className="p-4 bg-gray-50 rounded-md border">
            <p className="text-gray-800">{transcript}</p>
          </div>
        </div>
      )}

      {intent && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Detected Intent</h3>
          <div className="p-4 bg-blue-50 rounded-md border">
            <p className="text-blue-800">
              <strong>{intent.intent.toUpperCase()}</strong> 
              <span className="text-blue-600"> ({Math.round(intent.confidence * 100)}% confidence)</span>
            </p>
          </div>
        </div>
      )}

      {entities && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Extracted Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {entities.people.length > 0 && (
              <div className="p-3 bg-green-50 rounded-md">
                <strong className="text-green-800">People:</strong>
                <p className="text-green-700">{entities.people.join(', ')}</p>
              </div>
            )}
            {entities.dates.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-md">
                <strong className="text-yellow-800">Dates:</strong>
                <p className="text-yellow-700">{entities.dates.join(', ')}</p>
              </div>
            )}
            {entities.topics.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-md">
                <strong className="text-purple-800">Topics:</strong>
                <p className="text-purple-700">{entities.topics.join(', ')}</p>
              </div>
            )}
            {entities.sentiment && (
              <div className="p-3 bg-indigo-50 rounded-md">
                <strong className="text-indigo-800">Sentiment:</strong>
                <p className="text-indigo-700">{entities.sentiment}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {emailDraft && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Generated Email</h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <strong>Subject:</strong> {emailDraft.subject}
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-gray-800 font-sans">
                {emailDraft.body}
              </pre>
            </div>
            <div className="bg-gray-50 p-3 border-t text-sm text-gray-600">
              Tone: {emailDraft.tone}
            </div>
          </div>

          {emailDraft.alternatives && emailDraft.alternatives.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Alternative Versions:</h4>
              <div className="space-y-2">
                {emailDraft.alternatives.map((alt, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium">{alt.subject}</div>
                    <div className="text-sm text-gray-600 mt-1">{alt.tone} tone</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {step === 'complete' && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={resetSession}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Record Another
          </button>
          <button
            onClick={() => {
              if (emailDraft) {
                navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
                alert('Email copied to clipboard!');
              }
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Copy Email
          </button>
        </div>
      )}
    </div>
  );
}
