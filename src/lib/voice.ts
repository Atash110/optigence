/**
 * OptiMail Voice Enhancement Service
 * Phase 4: Advanced voice capabilities with Whisper/Deepgram integration
 */

export interface VoiceConfig {
  provider: 'openai' | 'deepgram' | 'browser';
  language: string;
  model?: string;
  enhanced?: boolean;
  realtime?: boolean;
}

export interface VoiceResult {
  transcript: string;
  confidence: number;
  language: string;
  duration: number;
  provider: string;
  alternatives?: string[];
  emotions?: {
    tone: 'neutral' | 'urgent' | 'friendly' | 'formal';
    confidence: number;
  };
}

export interface VoiceToActionResult {
  action: 'compose' | 'reply' | 'forward' | 'schedule' | 'reminder' | 'search';
  transcript: string;
  context: {
    recipient?: string;
    subject?: string;
    urgency?: 'low' | 'medium' | 'high';
    scheduledTime?: string;
    attachments?: string[];
  };
}

class VoiceEnhancementService {
  private config: VoiceConfig;
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(config: VoiceConfig = {
    provider: 'browser',
    language: 'en-US',
    enhanced: true,
    realtime: false
  }) {
    this.config = config;
  }

  /**
   * Start enhanced voice recording with provider selection
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      
      console.log(`Started recording with ${this.config.provider} provider`);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      // Return a more user-friendly error instead of throwing
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new Error('Microphone access was denied. Please allow microphone access and try again.');
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please check your microphone connection.');
      } else {
        throw new Error('Microphone access denied or not available. Please check your browser permissions.');
      }
    }
  }

  /**
   * Stop recording and process with selected provider
   */
  async stopRecording(): Promise<VoiceResult> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('No active recording session');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          const result = await this.processAudioWithProvider(audioBlob);
          
          this.isRecording = false;
          this.mediaRecorder = null;
          this.audioChunks = [];
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder!.stop();
    });
  }

  /**
   * Process audio with the selected provider (Whisper, Deepgram, or Browser)
   */
  private async processAudioWithProvider(audioBlob: Blob): Promise<VoiceResult> {
    const startTime = Date.now();

    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.processWithWhisper(audioBlob, startTime);
        case 'deepgram':
          return await this.processWithDeepgram(audioBlob, startTime);
        case 'browser':
        default:
          return await this.processWithBrowser(audioBlob, startTime);
      }
    } catch (error) {
      console.error(`${this.config.provider} processing failed, falling back to browser:`, error);
      return await this.processWithBrowser(audioBlob, startTime);
    }
  }

  /**
   * Process with OpenAI Whisper API
   */
  private async processWithWhisper(audioBlob: Blob, startTime: number): Promise<VoiceResult> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', this.config.model || 'whisper-1');
    formData.append('language', this.config.language.split('-')[0]);

    const response = await fetch('/api/optimail/voice/whisper', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Whisper API failed');
    
    const data = await response.json();
    const duration = Date.now() - startTime;

    return {
      transcript: data.text,
      confidence: data.confidence || 0.9,
      language: this.config.language,
      duration,
      provider: 'openai',
      alternatives: data.alternatives || [],
      emotions: this.analyzeEmotionalTone(data.text)
    };
  }

  /**
   * Process with Deepgram API
   */
  private async processWithDeepgram(audioBlob: Blob, startTime: number): Promise<VoiceResult> {
    const response = await fetch('/api/optimail/voice/deepgram', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav'
      },
      body: audioBlob
    });

    if (!response.ok) throw new Error('Deepgram API failed');
    
    const data = await response.json();
    const duration = Date.now() - startTime;

    return {
      transcript: data.results.channels[0].alternatives[0].transcript,
      confidence: data.results.channels[0].alternatives[0].confidence,
      language: this.config.language,
      duration,
      provider: 'deepgram',
      alternatives: data.results.channels[0].alternatives.slice(1).map((alt: { transcript: string }) => alt.transcript),
      emotions: this.analyzeEmotionalTone(data.results.channels[0].alternatives[0].transcript)
    };
  }

  /**
   * Process with Browser Web Speech API (fallback)
   */
  private async processWithBrowser(audioBlob: Blob, startTime: number): Promise<VoiceResult> {
    // For browser fallback, we'll use a simulated transcription
    // In a real implementation, this would use the Web Speech API
    const duration = Date.now() - startTime;
    
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        resolve({
          transcript: "Browser transcription not available for recorded audio",
          confidence: 0.7,
          language: this.config.language,
          duration,
          provider: 'browser',
          emotions: { tone: 'neutral', confidence: 0.5 }
        });
      }, 500);
    });
  }

  /**
   * Analyze emotional tone from transcript
   */
  private analyzeEmotionalTone(text: string): { tone: 'neutral' | 'urgent' | 'friendly' | 'formal'; confidence: number } {
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
    const friendlyWords = ['thanks', 'please', 'hope', 'appreciate', 'kind'];
    const formalWords = ['regarding', 'pursuant', 'accordingly', 'hereby', 'furthermore'];

    const lowerText = text.toLowerCase();
    
    const urgentScore = urgentWords.reduce((score, word) => 
      lowerText.includes(word) ? score + 1 : score, 0);
    const friendlyScore = friendlyWords.reduce((score, word) => 
      lowerText.includes(word) ? score + 1 : score, 0);
    const formalScore = formalWords.reduce((score, word) => 
      lowerText.includes(word) ? score + 1 : score, 0);

    if (urgentScore > 0) return { tone: 'urgent', confidence: Math.min(urgentScore * 0.3, 0.9) };
    if (formalScore > friendlyScore) return { tone: 'formal', confidence: Math.min(formalScore * 0.25, 0.8) };
    if (friendlyScore > 0) return { tone: 'friendly', confidence: Math.min(friendlyScore * 0.25, 0.8) };
    
    return { tone: 'neutral', confidence: 0.5 };
  }

  /**
   * Voice-to-Action: Convert voice input directly to actionable email commands
   */
  async voiceToAction(transcript: string): Promise<VoiceToActionResult> {
    // Analyze the transcript for actionable commands
    const lowerTranscript = transcript.toLowerCase();
    
    // Action detection patterns
    const actionPatterns = {
      compose: /(?:compose|create|write|draft|send|new).+(?:email|message)/,
      reply: /(?:reply|respond|answer).+(?:to|email|message)/,
      forward: /(?:forward|fwd).+(?:email|message|to)/,
      schedule: /(?:schedule|send later|delay|set time)/,
      reminder: /(?:remind|reminder|follow up|ping)/,
      search: /(?:search|find|look for|show me)/
    };

    // Extract action
    let action: VoiceToActionResult['action'] = 'compose';
    for (const [actionKey, pattern] of Object.entries(actionPatterns)) {
      if (pattern.test(lowerTranscript)) {
        action = actionKey as VoiceToActionResult['action'];
        break;
      }
    }

    // Extract context
    const context: VoiceToActionResult['context'] = {};
    
    // Extract recipient
    const toMatch = transcript.match(/(?:to|send to|email)\s+([A-Za-z\s]+?)(?:\s|$|,|\.|about|regarding)/);
    if (toMatch) context.recipient = toMatch[1].trim();

    // Extract subject
    const subjectMatch = transcript.match(/(?:about|regarding|subject|re:)\s+([^,\.]+)/);
    if (subjectMatch) context.subject = subjectMatch[1].trim();

    // Extract urgency
    if (/urgent|asap|immediately|critical|emergency/i.test(transcript)) {
      context.urgency = 'high';
    } else if (/soon|important|priority/i.test(transcript)) {
      context.urgency = 'medium';
    } else {
      context.urgency = 'low';
    }

    // Extract scheduled time
    const timeMatch = transcript.match(/(?:at|on|tomorrow|next|in)\s+([^,\.]+)/);
    if (timeMatch && action === 'schedule') {
      context.scheduledTime = timeMatch[1].trim();
    }

    return {
      action,
      transcript,
      context
    };
  }

  /**
   * Real-time voice processing with streaming
   */
  async startRealtimeVoice(onTranscript: (partial: string, final: boolean) => void): Promise<void> {
    if (!this.config.realtime) {
      throw new Error('Real-time voice processing not enabled');
    }

    // Implementation would depend on provider
    // For now, simulate with browser Speech Recognition
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new() => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: (event: Event) => void;
        onerror: (event: Event) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new() => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: (event: Event) => void;
        onerror: (event: Event) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
    };
    const SpeechRecognitionClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      throw new Error('Real-time speech recognition not supported');
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this.config.language;

    recognition.onresult = (event: Event) => {
      const speechEvent = event as unknown as { 
        resultIndex: number; 
        results: { [key: number]: { isFinal: boolean; [key: number]: { transcript: string } } } 
      };
      for (let i = speechEvent.resultIndex; i < Object.keys(speechEvent.results).length; i++) {
        const result = speechEvent.results[i];
        onTranscript(result[0].transcript, result.isFinal);
      }
    };

    recognition.start();
  }
}

export default VoiceEnhancementService;
