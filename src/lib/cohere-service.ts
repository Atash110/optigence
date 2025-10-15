/**
 * Cohere API Integration for OptiMail
 * Handles intent classification and text generation using Cohere's Chat API
 * Note: Cohere's Classify API was discontinued for general models in Jan 2025
 */

interface CohereConfig {
  apiKey: string;
  baseUrl: string;
}

interface CohereChatRequest {
  model: string;
  message: string;
  chat_history?: Array<{
    role: 'USER' | 'CHATBOT';
    message: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  k?: number;
  p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
}

interface CohereChatResponse {
  response_id: string;
  text: string;
  generation_id: string;
  chat_history: Array<{
    role: 'USER' | 'CHATBOT';
    message: string;
  }>;
  finish_reason: string;
  meta?: {
    api_version: {
      version: string;
    };
    billed_units?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

export interface CohereClassificationResult {
  intent: string;
  confidence: number;
  secondary?: string[];
  reasoning?: string;
  context?: string;
}

export class CohereService {
  private config: CohereConfig;

  constructor() {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      throw new Error('COHERE_API_KEY environment variable is required');
    }

    this.config = {
      apiKey,
      baseUrl: 'https://api.cohere.ai/v1'
    };
  }

  private async makeRequest(endpoint: string, body: CohereChatRequest | Record<string, unknown>): Promise<CohereChatResponse> {
    const response = await fetch(`${this.config.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cohere API error: ${errorData.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Classify user intent using Cohere's Chat API with structured prompting
   */
  async classifyIntent(
    text: string,
    context?: { 
      userPreferences?: Record<string, unknown>; 
      recentHistory?: string[]; 
      emailContext?: Record<string, unknown>;
    }
  ): Promise<CohereClassificationResult> {
    const prompt = `You are an expert email intent classifier. Analyze the following text and classify its primary intent.

Available intents:
- reply: User wants to respond to an email
- compose: User wants to write a new email
- summarize: User wants to summarize email content
- translate: User wants to translate text
- schedule: User wants to schedule a meeting or event
- template: User wants to save or use an email template
- travel: User mentions travel plans (route to OptiTrip)
- shopping: User mentions products/purchases (route to OptiShop)
- assistance: General help or unclear intent

${context?.emailContext ? `Email context: ${JSON.stringify(context.emailContext)}` : ''}
${context?.userPreferences ? `User preferences: ${JSON.stringify(context.userPreferences)}` : ''}

Text to classify: "${text}"

Respond with ONLY a JSON object in this format:
{
  "intent": "primary_intent",
  "confidence": 0.85,
  "secondary": ["secondary_intent_1", "secondary_intent_2"],
  "reasoning": "Brief explanation of why this classification was chosen"
}`;

    try {
      const request: CohereChatRequest = {
        model: 'command-light',
        message: prompt,
        temperature: 0.1,
        max_tokens: 200,
        stop_sequences: ['}']
      };

      const response: CohereChatResponse = await this.makeRequest('chat', request);
      
      // Parse the JSON response
      let jsonText = response.text.trim();
      if (!jsonText.endsWith('}')) {
        jsonText += '}';
      }

      const parsed = JSON.parse(jsonText);
      
      return {
        intent: parsed.intent || 'assistance',
        confidence: Math.min(parsed.confidence || 0.8, 0.95),
        secondary: parsed.secondary || [],
        reasoning: parsed.reasoning || 'AI classification',
        context: response.response_id
      };

    } catch (error) {
      console.error('Cohere classification error:', error);
      
      // Enhanced fallback with pattern matching
      return this.fallbackClassification(text);
    }
  }

  /**
   * Enhanced local fallback classification
   */
  private fallbackClassification(text: string): CohereClassificationResult {
    const lowerText = text.toLowerCase();
    
    const intentPatterns = {
      reply: {
        patterns: [/reply|respond|answer|get back|write back|response/],
        weight: 0.9
      },
      schedule: {
        patterns: [/schedule|meeting|calendar|appointment|book|arrange.*meeting|set up.*call|available times/],
        weight: 0.85
      },
      summarize: {
        patterns: [/summarize|summary|key points|overview|brief|digest|tldr/],
        weight: 0.9
      },
      translate: {
        patterns: [/translate|translation|in (french|spanish|german|chinese|japanese)/],
        weight: 0.95
      },
      travel: {
        patterns: [/travel|trip|flight|hotel|vacation|destination|airport|booking/],
        weight: 0.8
      },
      shopping: {
        patterns: [/buy|purchase|product|price|deal|shop|compare.*price|best.*deal/],
        weight: 0.8
      },
      template: {
        patterns: [/template|save.*format|reusable|store.*template/],
        weight: 0.9
      },
      compose: {
        patterns: [/write|compose|draft|create.*email|new email/],
        weight: 0.8
      }
    };

    let bestIntent = 'assistance';
    let bestConfidence = 0.6;
    let bestReasoning = 'Default classification';

    for (const [intent, config] of Object.entries(intentPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(lowerText)) {
          if (config.weight > bestConfidence) {
            bestIntent = intent;
            bestConfidence = config.weight;
            bestReasoning = `Pattern match: ${pattern.source}`;
          }
        }
      }
    }

    return {
      intent: bestIntent,
      confidence: bestConfidence,
      reasoning: bestReasoning + ' (fallback classification)',
      secondary: []
    };
  }

  /**
   * Generate contextual suggestions using Cohere
   */
  async generateSuggestions(
    intent: string,
    userText: string,
    context?: {
      emailContent?: string;
      userPreferences?: Record<string, unknown>;
      contactHistory?: Record<string, unknown>;
    }
  ): Promise<string[]> {
    const prompt = `Generate 3-4 actionable suggestions for a user with intent "${intent}".

User input: "${userText}"
${context?.emailContent ? `Email context: ${context.emailContent.slice(0, 500)}` : ''}

Provide practical, specific suggestions as a JSON array:
["suggestion1", "suggestion2", "suggestion3"]`;

    try {
      const request: CohereChatRequest = {
        model: 'command-light',
        message: prompt,
        temperature: 0.3,
        max_tokens: 150
      };

      const response: CohereChatResponse = await this.makeRequest('chat', request);
      const suggestions = JSON.parse(response.text.trim());
      
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('Cohere suggestions error:', error);
      return this.getFallbackSuggestions(intent);
    }
  }

  /**
   * Fallback suggestions based on intent
   */
  private getFallbackSuggestions(intent: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      reply: [
        'Generate AI reply options',
        'Reply with calendar availability',
        'Send professional response'
      ],
      compose: [
        'Draft professional email',
        'Create template',
        'Add recipients and subject'
      ],
      schedule: [
        'Find available time slots',
        'Create calendar event',
        'Send meeting invite'
      ],
      summarize: [
        'Generate key points',
        'Create action items list',
        'Extract important details'
      ],
      translate: [
        'Translate to preferred language',
        'Adjust tone and formality',
        'Check grammar and style'
      ],
      travel: [
        'Open OptiTrip for travel planning',
        'Find flight options',
        'Compare hotel prices'
      ],
      shopping: [
        'Open OptiShop for deals',
        'Compare product prices',
        'Get recommendations'
      ],
      template: [
        'Save as email template',
        'Add to template library',
        'Set template category'
      ],
      assistance: [
        'Get AI assistance',
        'Process with smart suggestions',
        'Analyze content'
      ]
    };

    return suggestionMap[intent] || suggestionMap.assistance;
  }

  /**
   * Test Cohere API connection
   */
  async testConnection(): Promise<{
    success: boolean;
    latency: number;
    model: string;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      const request: CohereChatRequest = {
        model: 'command-light',
        message: 'Test connection - respond with "OK"',
        max_tokens: 10
      };

      const response: CohereChatResponse = await this.makeRequest('chat', request);
      const latency = Date.now() - start;

      return {
        success: !!response.text,
        latency,
        model: 'command-light'
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - start,
        model: 'command-light',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze email tone and sentiment using Cohere
   */
  async analyzeEmailTone(emailContent: string): Promise<{
    tone: string;
    sentiment: string;
    formality: string;
    urgency: string;
    confidence: number;
  }> {
    const prompt = `Analyze the tone and sentiment of this email. Respond with JSON:

{
  "tone": "professional|casual|friendly|formal|urgent",
  "sentiment": "positive|neutral|negative", 
  "formality": "very_formal|formal|neutral|casual|very_casual",
  "urgency": "low|medium|high",
  "confidence": 0.85
}

Email content:
${emailContent.slice(0, 2000)}`;

    try {
      const request: CohereChatRequest = {
        model: 'command-light',
        message: prompt,
        temperature: 0.1,
        max_tokens: 100
      };

      const response: CohereChatResponse = await this.makeRequest('chat', request);
      const parsed = JSON.parse(response.text.trim());
      
      return {
        tone: parsed.tone || 'professional',
        sentiment: parsed.sentiment || 'neutral',
        formality: parsed.formality || 'neutral',
        urgency: parsed.urgency || 'medium',
        confidence: parsed.confidence || 0.8
      };
    } catch (error) {
      console.error('Cohere tone analysis error:', error);
      
      // Simple fallback
      const urgency = /urgent|asap|immediately|quickly/i.test(emailContent) ? 'high' : 'medium';
      const formality = /dear|sincerely|regards/i.test(emailContent) ? 'formal' : 'casual';
      
      return {
        tone: 'professional',
        sentiment: 'neutral',
        formality,
        urgency,
        confidence: 0.6
      };
    }
  }
}

// Export singleton instance
export const cohereService = new CohereService();
export default cohereService;
