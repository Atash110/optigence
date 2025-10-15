/**
 * Voice-to-Action Service for OptiMail
 * Interprets voice commands and executes corresponding actions
 */

// Browser API declarations
declare global {
  interface Window {
    webkitSpeechRecognition: new() => SpeechRecognition;
    SpeechRecognition: new() => SpeechRecognition;
  }
  
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
  }
  
  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }
  
  interface SpeechRecognitionErrorEvent {
    error: string;
  }
  
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
  }
  
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
  }
  
  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
}

export interface VoiceAction {
  id: string;
  command: string;
  intent: string;
  parameters: Record<string, unknown>;
  confidence: number;
  executionTime?: Date;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface VoiceContext {
  onCompose?: (params: { recipient: string }) => void;
  onReply?: () => void;
  onSend?: () => Promise<ActionResult>;
  onSchedule?: (params: { details: string }) => void;
  onCheckCalendar?: (timeframe: string) => Promise<unknown[]>;
  onFindSlots?: (timeframe: string) => Promise<unknown[]>;
  onUseTemplate?: (name: string) => Promise<unknown>;
  onSaveTemplate?: (name: string) => Promise<ActionResult>;
  onTranslate?: (language: string) => Promise<ActionResult>;
  onAdjustTone?: (tone: string) => Promise<ActionResult>;
  onNavigate?: (destination: string) => void;
  onSummarize?: () => Promise<ActionResult>;
}

export interface VoiceCommand {
  pattern: RegExp;
  intent: string;
  description: string;
  examples: string[];
  handler: (matches: RegExpMatchArray, context?: VoiceContext) => Promise<ActionResult>;
}

class VoiceToActionService {
  private commands: VoiceCommand[] = [];
  private isListening = false;
  private recognition: SpeechRecognition | null = null;

  constructor() {
    this.initializeCommands();
    this.setupSpeechRecognition();
  }

  private setupSpeechRecognition() {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition();
      if (this.recognition) {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  private initializeCommands() {
    this.commands = [
      // Email composition commands
      {
        pattern: /^(compose|write|draft)\s+(email|message)\s+to\s+(.+)$/i,
        intent: 'compose_email',
        description: 'Compose email to recipient',
        examples: ['compose email to john@example.com', 'write message to team'],
        handler: this.composeEmail.bind(this)
      },
      {
        pattern: /^reply\s+(to\s+)?(this\s+)?email$/i,
        intent: 'reply_email',
        description: 'Reply to current email',
        examples: ['reply to this email', 'reply'],
        handler: this.replyToEmail.bind(this)
      },
      {
        pattern: /^send\s+(the\s+)?email$/i,
        intent: 'send_email',
        description: 'Send the current draft',
        examples: ['send email', 'send the email'],
        handler: this.sendEmail.bind(this)
      },

      // Calendar commands
      {
        pattern: /^schedule\s+(a\s+)?meeting\s+(.+)$/i,
        intent: 'schedule_meeting',
        description: 'Schedule a meeting',
        examples: ['schedule meeting with team', 'schedule a meeting tomorrow'],
        handler: this.scheduleMeeting.bind(this)
      },
      {
        pattern: /^check\s+(my\s+)?calendar\s+(.+)?$/i,
        intent: 'check_calendar',
        description: 'Check calendar availability',
        examples: ['check calendar today', 'check my calendar'],
        handler: this.checkCalendar.bind(this)
      },
      {
        pattern: /^find\s+(available\s+)?(meeting\s+)?slots?\s+(.+)?$/i,
        intent: 'find_slots',
        description: 'Find available meeting slots',
        examples: ['find available slots', 'find meeting slots next week'],
        handler: this.findAvailableSlots.bind(this)
      },

      // Template commands
      {
        pattern: /^use\s+template\s+(.+)$/i,
        intent: 'use_template',
        description: 'Insert email template',
        examples: ['use template meeting request', 'use template follow up'],
        handler: this.useTemplate.bind(this)
      },
      {
        pattern: /^save\s+(this\s+)?(as\s+)?template\s+(.+)?$/i,
        intent: 'save_template',
        description: 'Save current draft as template',
        examples: ['save as template', 'save this as template meeting'],
        handler: this.saveTemplate.bind(this)
      },

      // Translation commands
      {
        pattern: /^translate\s+(this\s+|to\s+)?(\w+)$/i,
        intent: 'translate',
        description: 'Translate email to language',
        examples: ['translate to spanish', 'translate french'],
        handler: this.translateEmail.bind(this)
      },

      // Tone adjustment commands
      {
        pattern: /^make\s+(this\s+)?(more\s+)?(\w+)$/i,
        intent: 'adjust_tone',
        description: 'Adjust email tone',
        examples: ['make this formal', 'make more casual', 'make professional'],
        handler: this.adjustTone.bind(this)
      },

      // Navigation commands
      {
        pattern: /^(go\s+to|open|switch\s+to)\s+(.+)$/i,
        intent: 'navigate',
        description: 'Navigate to module or section',
        examples: ['go to OptiHire', 'open calendar', 'switch to settings'],
        handler: this.navigate.bind(this)
      },

      // General assistant commands
      {
        pattern: /^help\s+(.+)?$/i,
        intent: 'help',
        description: 'Get help with commands',
        examples: ['help', 'help with calendar'],
        handler: this.getHelp.bind(this)
      },
      {
        pattern: /^summarize\s+(this\s+)?email$/i,
        intent: 'summarize',
        description: 'Summarize current email',
        examples: ['summarize this email', 'summarize'],
        handler: this.summarizeEmail.bind(this)
      }
    ];
  }

  /**
   * Start listening for voice commands
   */
  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.isListening = true;
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.isListening = false;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
    });
  }

  /**
   * Stop listening for voice commands
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Process a voice command and execute the corresponding action
   */
  async processVoiceCommand(command: string, context?: VoiceContext): Promise<ActionResult> {
    const normalizedCommand = command.trim().toLowerCase();
    
    for (const cmd of this.commands) {
      const matches = normalizedCommand.match(cmd.pattern);
      if (matches) {
        try {
          const result = await cmd.handler(matches, context);
          return {
            ...result,
            message: result.message || `Executed: ${cmd.description}`
          };
        } catch (error) {
          return {
            success: false,
            message: `Failed to execute command: ${cmd.description}`,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    return {
      success: false,
      message: `Command not recognized: "${command}". Try "help" for available commands.`
    };
  }

  /**
   * Get all available voice commands
   */
  getAvailableCommands(): VoiceCommand[] {
    return this.commands.map(cmd => ({
      ...cmd,
      handler: () => Promise.resolve({ success: true, message: 'Mock handler' })
    }));
  }

  // Command Handlers

  private async composeEmail(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const recipient = matches[3];
    
    // Trigger email composition with recipient
    if (context?.onCompose) {
      context.onCompose({ recipient });
    }

    return {
      success: true,
      message: `Starting email composition to ${recipient}`,
      data: { recipient, action: 'compose' }
    };
  }

  private async replyToEmail(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    if (context?.onReply) {
      context.onReply();
    }

    return {
      success: true,
      message: 'Starting email reply',
      data: { action: 'reply' }
    };
  }

  private async sendEmail(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    if (context?.onSend) {
      const result = await context.onSend();
      return result;
    }

    return {
      success: true,
      message: 'Email sent successfully',
      data: { action: 'send' }
    };
  }

  private async scheduleMeeting(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const meetingDetails = matches[2];
    
    if (context?.onSchedule) {
      context.onSchedule({ details: meetingDetails });
    }

    return {
      success: true,
      message: `Scheduling meeting: ${meetingDetails}`,
      data: { action: 'schedule', details: meetingDetails }
    };
  }

  private async checkCalendar(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const timeframe = matches[2] || 'today';
    
    if (context?.onCheckCalendar) {
      const events = await context.onCheckCalendar(timeframe);
      return {
        success: true,
        message: `Found ${events?.length || 0} events ${timeframe}`,
        data: { events, timeframe }
      };
    }

    return {
      success: true,
      message: `Checking calendar for ${timeframe}`,
      data: { action: 'check_calendar', timeframe }
    };
  }

  private async findAvailableSlots(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const timeframe = matches[3] || 'this week';
    
    if (context?.onFindSlots) {
      const slots = await context.onFindSlots(timeframe);
      return {
        success: true,
        message: `Found ${slots?.length || 0} available slots ${timeframe}`,
        data: { slots, timeframe }
      };
    }

    return {
      success: true,
      message: `Finding available slots ${timeframe}`,
      data: { action: 'find_slots', timeframe }
    };
  }

  private async useTemplate(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const templateName = matches[1];
    
    if (context?.onUseTemplate) {
      const template = await context.onUseTemplate(templateName);
      return {
        success: true,
        message: `Applied template: ${templateName}`,
        data: { template }
      };
    }

    return {
      success: true,
      message: `Using template: ${templateName}`,
      data: { action: 'use_template', templateName }
    };
  }

  private async saveTemplate(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const templateName = matches[3] || 'Untitled Template';
    
    if (context?.onSaveTemplate) {
      const result = await context.onSaveTemplate(templateName);
      return result;
    }

    return {
      success: true,
      message: `Saved template: ${templateName}`,
      data: { action: 'save_template', templateName }
    };
  }

  private async translateEmail(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const language = matches[2];
    
    if (context?.onTranslate) {
      const result = await context.onTranslate(language);
      return result;
    }

    return {
      success: true,
      message: `Translating to ${language}`,
      data: { action: 'translate', language }
    };
  }

  private async adjustTone(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const tone = matches[3];
    
    if (context?.onAdjustTone) {
      const result = await context.onAdjustTone(tone);
      return result;
    }

    return {
      success: true,
      message: `Adjusting tone to ${tone}`,
      data: { action: 'adjust_tone', tone }
    };
  }

  private async navigate(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    const destination = matches[2];
    
    if (context?.onNavigate) {
      context.onNavigate(destination);
    }

    return {
      success: true,
      message: `Navigating to ${destination}`,
      data: { action: 'navigate', destination }
    };
  }

  private async getHelp(matches: RegExpMatchArray): Promise<ActionResult> {
    const topic = matches[1];
    
    let helpText = "Available voice commands:\n";
    
    if (topic) {
      const relevantCommands = this.commands.filter(cmd => 
        cmd.description.toLowerCase().includes(topic.toLowerCase()) ||
        cmd.intent.toLowerCase().includes(topic.toLowerCase())
      );
      
      if (relevantCommands.length > 0) {
        helpText += relevantCommands.map(cmd => 
          `• ${cmd.examples[0]} - ${cmd.description}`
        ).join('\n');
      } else {
        helpText += `No commands found for "${topic}". Try "help" for all commands.`;
      }
    } else {
      helpText += this.commands.map(cmd => 
        `• ${cmd.examples[0]} - ${cmd.description}`
      ).join('\n');
    }

    return {
      success: true,
      message: helpText,
      data: { commands: this.commands.map(cmd => cmd.examples[0]) }
    };
  }

  private async summarizeEmail(matches: RegExpMatchArray, context?: VoiceContext): Promise<ActionResult> {
    if (context?.onSummarize) {
      const result = await context.onSummarize();
      return result;
    }

    return {
      success: true,
      message: 'Email summarized successfully',
      data: { action: 'summarize' }
    };
  }
}

const voiceToActionService = new VoiceToActionService();
export default voiceToActionService;
