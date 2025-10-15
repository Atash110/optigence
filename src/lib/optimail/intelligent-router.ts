import { HybridLLMClients, AdvancedIntentClassifier, IntentClassification } from './llm-clients';
import { VectorMemorySystem, MemoryContext } from './vector-memory';
import { EmotionalIntelligence, EmotionalAnalysis } from './emotional-intelligence';

export interface UserContext {
  userId?: string;
  preferences?: {
    language: string;
    style: string;
    formality: number; // 0-1 scale
  };
  history?: string[];
}

export interface EmailRequest {
  purpose: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'empathetic' | 'persuasive';
  originalEmail?: string;
  emailThread?: string;
  userContext?: UserContext;
  userPreferences?: {
    language: string;
    style: string;
    formality: number; // 0-1 scale
  };
}

export interface EmailResponse {
  content: string;
  confidence: number;
  usedLLM: string;
  emotionalAnalysis?: EmotionalAnalysis;
  suggestions?: string[];
  metadata: {
    processingTime: number;
    intent: string;
    complexity: string;
  };
}

export class IntelligentEmailRouter {
  private llmClients: HybridLLMClients;
  private intentClassifier: AdvancedIntentClassifier;
  private vectorMemory: VectorMemorySystem;
  private emotionalIntelligence: EmotionalIntelligence;

  constructor(
    llmClients: HybridLLMClients,
    intentClassifier: AdvancedIntentClassifier,
    vectorMemory: VectorMemorySystem,
    emotionalIntelligence: EmotionalIntelligence
  ) {
    this.llmClients = llmClients;
    this.intentClassifier = intentClassifier;
    this.vectorMemory = vectorMemory;
    this.emotionalIntelligence = emotionalIntelligence;
  }

  async processEmailRequest(request: EmailRequest): Promise<EmailResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Intent Classification
      const classification = await this.intentClassifier.classifyIntent(request.purpose);

      // Step 2: Retrieve relevant context from vector memory
      const memoryContext = await this.vectorMemory.retrieveRelevantContext(
        request.purpose,
        {
          limit: 5,
          threshold: 0.7
        }
      );

      // Step 3: Emotional analysis and tone detection
      const emotionalAnalysis = await this.emotionalIntelligence.analyzeEmotionalContext(
        request.purpose,
        request.originalEmail || '',
        request.tone
      );

      // Step 4: Route to optimal LLM based on classification and context
      const response = await this.routeToOptimalLLM(request, classification, memoryContext, emotionalAnalysis);

      // Step 5: Store interaction for future learning
      await this.vectorMemory.storeInteraction({
        input: request.purpose,
        output: response.content,
        intent: classification.intent,
        success: true,
        timestamp: new Date(),
        metadata: {
          usedLLM: response.usedLLM,
          confidence: response.confidence
        }
      });

      const processingTime = Date.now() - startTime;

      return {
        ...response,
        emotionalAnalysis,
        metadata: {
          processingTime,
          intent: classification.intent,
          complexity: classification.context.complexity
        }
      };

    } catch (error) {
      console.error('Email processing error:', error);
      
      // Fallback to OpenAI for simple composition
      const fallbackResponse = await this.llmClients.callOpenAI([
        { role: 'user', content: request.purpose }
      ], this.generateSystemPrompt('compose', request.tone || 'professional'));

      return {
        content: fallbackResponse,
        confidence: 0.5,
        usedLLM: 'openai-fallback',
        suggestions: ['This response was generated using fallback mode'],
        metadata: {
          processingTime: Date.now() - startTime,
          intent: 'compose',
          complexity: 'unknown'
        }
      };
    }
  }

  private async routeToOptimalLLM(
    request: EmailRequest,
    classification: IntentClassification,
    memoryContext: MemoryContext[],
    emotionalAnalysis: EmotionalAnalysis
  ): Promise<Omit<EmailResponse, 'metadata' | 'emotionalAnalysis'>> {
    
    const { suggestedLLM, intent, context } = classification;
    const systemPrompt = this.generateSystemPrompt(intent, request.tone || 'professional', memoryContext, emotionalAnalysis);

    let response: string;
    let usedLLM: string;
    const confidence: number = classification.confidence;

    try {
      switch (suggestedLLM) {
        case 'claude':
          response = await this.handleClaudeRequest(request, systemPrompt, intent);
          usedLLM = 'claude-3-sonnet';
          break;

        case 'gemini':
          response = await this.handleGeminiRequest(request, systemPrompt, intent);
          usedLLM = 'gemini-1.5-pro';
          break;

        case 'cohere':
          response = await this.handleCohereRequest(request, systemPrompt, intent);
          usedLLM = 'command-r-plus';
          break;

        case 'openai':
        default:
          response = await this.handleOpenAIRequest(request, systemPrompt, intent);
          usedLLM = 'gpt-4-turbo';
          break;
      }

      // Generate intelligent suggestions based on the response
      const suggestions = await this.generateSmartSuggestions(response, intent, context);

      return {
        content: response,
        confidence,
        usedLLM,
        suggestions
      };

    } catch (primaryError) {
      console.error(`Primary LLM (${suggestedLLM}) failed:`, primaryError);
      
      // Fallback to OpenAI
      try {
        response = await this.handleOpenAIRequest(request, systemPrompt, intent);
        return {
          content: response,
          confidence: confidence * 0.8, // Reduce confidence for fallback
          usedLLM: 'gpt-4-turbo-fallback',
          suggestions: ['Response generated using fallback system']
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error('All LLM systems failed');
      }
    }
  }

  private async handleOpenAIRequest(request: EmailRequest, systemPrompt: string, intent: string): Promise<string> {
    const messages = [
      { role: 'user', content: this.formatRequestForLLM(request, intent) }
    ];

    return await this.llmClients.callOpenAI(messages, systemPrompt);
  }

  private async handleClaudeRequest(request: EmailRequest, systemPrompt: string, intent: string): Promise<string> {
    const messages = [
      { role: 'user', content: this.formatRequestForLLM(request, intent) }
    ];

    return await this.llmClients.callClaude(messages, systemPrompt);
  }

  private async handleGeminiRequest(request: EmailRequest, systemPrompt: string, intent: string): Promise<string> {
    const prompt = this.formatRequestForLLM(request, intent);
    return await this.llmClients.callGemini(prompt, systemPrompt);
  }

  private async handleCohereRequest(request: EmailRequest, systemPrompt: string, intent: string): Promise<string> {
    const prompt = this.formatRequestForLLM(request, intent);
    return await this.llmClients.callCohere(prompt, systemPrompt);
  }

  private formatRequestForLLM(request: EmailRequest, intent: string): string {
    let formattedRequest = `Intent: ${intent}\n`;
    formattedRequest += `Purpose: ${request.purpose}\n`;
    
    if (request.tone) {
      formattedRequest += `Desired Tone: ${request.tone}\n`;
    }
    
    if (request.originalEmail) {
      formattedRequest += `Original Email:\n${request.originalEmail}\n`;
    }
    
    if (request.emailThread) {
      formattedRequest += `Email Thread:\n${request.emailThread}\n`;
    }

    return formattedRequest;
  }

  private generateSystemPrompt(
    intent: string,
    tone: string,
    memoryContext?: MemoryContext[],
    emotionalAnalysis?: EmotionalAnalysis
  ): string {
    let systemPrompt = `You are OptiMail, an advanced AI email assistant with human-level emotional intelligence and contextual understanding. `;

    // Base behavior
    systemPrompt += `Your responses should be natural, empathetic, and contextually appropriate. `;
    systemPrompt += `Always maintain the requested tone: ${tone}. `;

    // Intent-specific instructions
    switch (intent) {
      case 'compose':
        systemPrompt += `Create a well-structured, engaging email that accomplishes the user's purpose. `;
        break;
      case 'reply':
        systemPrompt += `Generate thoughtful, contextually appropriate reply options that address all points in the original email. `;
        break;
      case 'summarize':
        systemPrompt += `Provide a concise summary with key points and action items clearly identified. `;
        break;
      case 'rewrite':
        systemPrompt += `Improve the existing content while maintaining the core message and intent. `;
        break;
      case 'apology':
        systemPrompt += `Craft a sincere, empathetic apology that acknowledges the issue and offers resolution. `;
        break;
      case 'thank_you':
        systemPrompt += `Express genuine gratitude in a warm, appreciative manner. `;
        break;
      default:
        systemPrompt += `Address the user's request with clarity and professionalism. `;
    }

    // Memory context integration
    if (memoryContext && memoryContext.length > 0) {
      systemPrompt += `\nRelevant context from previous interactions:\n`;
      memoryContext.forEach((context, index) => {
        systemPrompt += `${index + 1}. ${context.summary || context.content}\n`;
      });
    }

    // Emotional intelligence integration
    if (emotionalAnalysis) {
      systemPrompt += `\nEmotional context: The user's current emotional state appears to be ${emotionalAnalysis.dominantEmotion} with ${emotionalAnalysis.confidence}% confidence. `;
      systemPrompt += `Adapt your response accordingly. `;
    }

    // Output format
    systemPrompt += `\nProvide your response in a format ready for immediate use. Include subject line if composing a new email.`;

    return systemPrompt;
  }

  private async generateSmartSuggestions(
    response: string,
    intent: string,
    context: IntentClassification['context']
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Length-based suggestions
    if (response.length > 1000) {
      suggestions.push('Consider shortening for better readability');
    } else if (response.length < 100) {
      suggestions.push('Consider adding more detail or context');
    }

    // Intent-specific suggestions
    switch (intent) {
      case 'compose':
        suggestions.push('Add a call-to-action if appropriate');
        if (!response.includes('Best regards') && !response.includes('Sincerely')) {
          suggestions.push('Consider adding a professional closing');
        }
        break;

      case 'reply':
        suggestions.push('Review all points from the original email are addressed');
        break;

      case 'apology':
        if (!response.toLowerCase().includes('sorry') && !response.toLowerCase().includes('apologize')) {
          suggestions.push('Ensure the apology is clearly stated');
        }
        suggestions.push('Consider offering a solution or next steps');
        break;

      case 'thank_you':
        suggestions.push('Consider mentioning specific actions you\'re grateful for');
        break;
    }

    // Urgency-based suggestions
    if (context.urgency === 'high') {
      suggestions.push('Consider indicating urgency in subject line');
    }

    // Emotional tone suggestions
    if (context.emotionalTone === 'negative') {
      suggestions.push('Review tone to ensure it\'s constructive and empathetic');
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  // Real-time adaptation method for continuous learning
  async provideFeedback(
    originalRequest: EmailRequest,
    generatedResponse: string,
    userFeedback: 'positive' | 'negative' | 'neutral',
    improvements?: string
  ): Promise<void> {
    try {
      await this.vectorMemory.storeFeedback({
        request: originalRequest,
        response: generatedResponse,
        feedback: userFeedback,
        improvements,
        timestamp: new Date()
      });

      // Update emotional intelligence model if feedback includes emotional context
      if (improvements && improvements.toLowerCase().includes('tone')) {
        await this.emotionalIntelligence.updateToneModel(
          originalRequest.purpose,
          userFeedback,
          improvements
        );
      }
    } catch (error) {
      console.error('Error storing feedback:', error);
    }
  }
}
