// Voice Assistant System for OptiMail using Deepgram API
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

export interface VoiceConfig {
  deepgramApiKey: string;
  language: string;
  model: string;
}

export interface VoiceTranscription {
  text: string;
  confidence: number;
  isFinal: boolean;
  metadata: {
    duration: number;
    language: string;
    model: string;
  };
}

export interface VoiceSynthesisOptions {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
}

export class VoiceAssistant {
  private deepgram: any;
  private isListening: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private onTranscriptionCallback?: (transcription: VoiceTranscription) => void;

  constructor(private config: VoiceConfig) {
    this.deepgram = createClient(config.deepgramApiKey);
  }

  // Start voice recognition
  async startListening(
    onTranscription: (transcription: VoiceTranscription) => void,
    options: {
      continuous?: boolean;
      interimResults?: boolean;
    } = {}
  ): Promise<void> {
    try {
      if (this.isListening) {
        console.warn('Already listening');
        return;
      }

      this.onTranscriptionCallback = onTranscription;

      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });

      // Setup Deepgram live transcription
      const connection = this.deepgram.listen.live({
        model: this.config.model || 'nova-2',
        language: this.config.language || 'en-US',
        smart_format: true,
        interim_results: options.interimResults || true,
        punctuate: true,
        profanity_filter: false,
        redact: false,
        utterance_end_ms: 1000,
        vad_events: true
      });

      // Handle transcription results
      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0];
        if (transcript) {
          const transcription: VoiceTranscription = {
            text: transcript.transcript,
            confidence: transcript.confidence || 0.0,
            isFinal: data.is_final || false,
            metadata: {
              duration: data.duration || 0,
              language: this.config.language,
              model: this.config.model || 'nova-2'
            }
          };

          if (this.onTranscriptionCallback) {
            this.onTranscriptionCallback(transcription);
          }
        }
      });

      // Handle connection events
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
        this.isListening = true;

        // Setup MediaRecorder to send audio to Deepgram
        this.mediaRecorder = new MediaRecorder(this.audioStream!, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(event.data);
          }
        };

        this.mediaRecorder.start(100); // Send data every 100ms
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        this.stopListening();
      });

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Deepgram error:', error);
        this.stopListening();
      });

    } catch (error) {
      console.error('Error starting voice recognition:', error);
      throw new Error('Failed to start voice recognition');
    }
  }

  // Stop voice recognition
  async stopListening(): Promise<void> {
    try {
      this.isListening = false;

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }

      this.mediaRecorder = null;
      this.onTranscriptionCallback = undefined;

    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  // Convert text to speech (using Web Speech API as fallback)
  async synthesizeSpeech(
    text: string,
    options: VoiceSynthesisOptions = {
      voice: 'default',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0
    }
  ): Promise<void> {
    try {
      // Check if browser supports Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice properties
        utterance.rate = options.speed;
        utterance.pitch = options.pitch;
        utterance.volume = options.volume;

        // Try to find a specific voice
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          const selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes(options.voice.toLowerCase())
          ) || voices[0];
          
          utterance.voice = selectedVoice;
        }

        // Speak the text
        speechSynthesis.speak(utterance);

        return new Promise((resolve, reject) => {
          utterance.onend = () => resolve();
          utterance.onerror = (error) => reject(error);
        });

      } else {
        throw new Error('Speech synthesis not supported');
      }

    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  // Get available voices
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return speechSynthesis.getVoices();
    }
    return [];
  }

  // Check if currently listening
  getIsListening(): boolean {
    return this.isListening;
  }

  // Process voice command and return structured data
  async processVoiceCommand(transcription: string): Promise<{
    intent: string;
    entities: { [key: string]: string };
    confidence: number;
    action: string;
  }> {
    try {
      const lowerText = transcription.toLowerCase();
      
      // Define command patterns
      const commandPatterns = new Map([
        ['compose', /(?:write|compose|create|draft)\s+(?:an?\s+)?email/i],
        ['reply', /(?:reply|respond)\s+to/i],
        ['summarize', /(?:summarize|summary|digest)/i],
        ['send', /(?:send|dispatch|transmit)/i],
        ['cancel', /(?:cancel|stop|abort|nevermind)/i],
        ['help', /(?:help|assist|guide)/i],
        ['read', /(?:read|speak|say)\s+(?:out|aloud)?/i]
      ]);

      let detectedIntent = 'unknown';
      let confidence = 0;

      // Find matching intent
      for (const [intent, pattern] of commandPatterns) {
        if (pattern.test(lowerText)) {
          detectedIntent = intent;
          confidence = 0.8;
          break;
        }
      }

      // Extract entities (simplified)
      const entities: { [key: string]: string } = {};
      
      // Extract recipient
      const recipientMatch = lowerText.match(/(?:to|for)\s+([a-zA-Z\s]+)/);
      if (recipientMatch) {
        entities.recipient = recipientMatch[1].trim();
      }

      // Extract subject
      const subjectMatch = lowerText.match(/(?:about|regarding|subject)\s+([^.!?]+)/);
      if (subjectMatch) {
        entities.subject = subjectMatch[1].trim();
      }

      // Extract tone
      const toneMatch = lowerText.match(/(?:in a|with a|using a)\s+(formal|casual|friendly|professional|urgent)\s+(?:tone|manner|style)/);
      if (toneMatch) {
        entities.tone = toneMatch[1];
      }

      // Determine action
      let action = 'process';
      if (detectedIntent === 'cancel') {
        action = 'cancel';
      } else if (detectedIntent === 'help') {
        action = 'help';
      } else if (detectedIntent === 'send') {
        action = 'send';
      }

      return {
        intent: detectedIntent,
        entities,
        confidence,
        action
      };

    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        action: 'error'
      };
    }
  }

  // Voice-first conversational flow
  async handleConversationalFlow(
    userInput: string,
    context: {
      currentStep: string;
      emailDraft?: string;
      recipient?: string;
      subject?: string;
    }
  ): Promise<{
    response: string;
    nextStep: string;
    shouldSpeak: boolean;
    actions: string[];
  }> {
    const { currentStep } = context;

    try {
      switch (currentStep) {
        case 'greeting':
          return {
            response: "Hi! I'm your OptiMail voice assistant. What would you like to help you with today? You can say things like 'compose an email' or 'reply to my last message'.",
            nextStep: 'listening_for_intent',
            shouldSpeak: true,
            actions: ['listen']
          };

        case 'listening_for_intent':
          const command = await this.processVoiceCommand(userInput);
          
          if (command.intent === 'compose') {
            return {
              response: "Great! I'll help you compose an email. Who would you like to send it to?",
              nextStep: 'collecting_recipient',
              shouldSpeak: true,
              actions: ['listen']
            };
          } else if (command.intent === 'reply') {
            return {
              response: "I'll help you craft a reply. What's the main point you want to communicate?",
              nextStep: 'collecting_content',
              shouldSpeak: true,
              actions: ['listen']
            };
          } else {
            return {
              response: "I can help you compose emails, reply to messages, or summarize email threads. What would you like to do?",
              nextStep: 'listening_for_intent',
              shouldSpeak: true,
              actions: ['listen']
            };
          }

        case 'collecting_recipient':
          return {
            response: `Perfect! Sending to ${userInput}. What's the subject of your email?`,
            nextStep: 'collecting_subject',
            shouldSpeak: true,
            actions: ['listen', 'store_recipient']
          };

        case 'collecting_subject':
          return {
            response: `Got it! Subject: "${userInput}". Now, what would you like to say in the email?`,
            nextStep: 'collecting_content',
            shouldSpeak: true,
            actions: ['listen', 'store_subject']
          };

        case 'collecting_content':
          return {
            response: "Perfect! Let me compose that email for you. I'll read it back when it's ready.",
            nextStep: 'generating_email',
            shouldSpeak: true,
            actions: ['compose_email']
          };

        case 'email_review':
          if (userInput.toLowerCase().includes('send')) {
            return {
              response: "Great! Your email is ready to send. You can copy it from the screen.",
              nextStep: 'complete',
              shouldSpeak: true,
              actions: ['finalize_email']
            };
          } else if (userInput.toLowerCase().includes('change') || userInput.toLowerCase().includes('edit')) {
            return {
              response: "What would you like me to change about the email?",
              nextStep: 'collecting_changes',
              shouldSpeak: true,
              actions: ['listen']
            };
          } else {
            return {
              response: "Would you like me to send this email, or would you like to make any changes?",
              nextStep: 'email_review',
              shouldSpeak: true,
              actions: ['listen']
            };
          }

        default:
          return {
            response: "I'm ready to help! What would you like to do?",
            nextStep: 'listening_for_intent',
            shouldSpeak: true,
            actions: ['listen']
          };
      }

    } catch (error) {
      console.error('Error in conversational flow:', error);
      return {
        response: "Sorry, I encountered an error. Let's start over. What can I help you with?",
        nextStep: 'listening_for_intent',
        shouldSpeak: true,
        actions: ['listen']
      };
    }
  }

  // Real-time voice activity detection
  async detectVoiceActivity(
    onActivity: (isActive: boolean) => void,
    threshold: number = 0.01
  ): Promise<void> {
    try {
      if (!this.audioStream) {
        throw new Error('No audio stream available');
      }

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(this.audioStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let isCurrentlyActive = false;

      const checkActivity = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const normalizedVolume = average / 255;

        const isActive = normalizedVolume > threshold;
        
        if (isActive !== isCurrentlyActive) {
          isCurrentlyActive = isActive;
          onActivity(isActive);
        }

        if (this.isListening) {
          requestAnimationFrame(checkActivity);
        }
      };

      checkActivity();

    } catch (error) {
      console.error('Error detecting voice activity:', error);
    }
  }
}
