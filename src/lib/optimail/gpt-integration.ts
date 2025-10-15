import OpenAI from 'openai';

interface EmailContext {
  content: string;
  sender?: string;
  recipient?: string;
  subject?: string;
  timestamp?: Date;
  thread?: string[];
  userPreferences?: {
    tone: 'professional' | 'casual' | 'friendly';
    length: 'brief' | 'detailed' | 'comprehensive';
    language: string;
  };
}

interface SuggestionResult {
  suggestions: string[];
  confidence: number;
  intent: string;
  context: string;
}

class GPTEmailAssistant {
  private openai: OpenAI;
  private initialized = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Test connection
      await this.openai.models.list();
      this.initialized = true;
      console.log('GPT-4 Email Assistant initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GPT-4:', error);
      throw error;
    }
  }

  /**
   * Generate context-aware email suggestions based on user input
   */
  async generateContextualSuggestions(
    input: string,
    context: EmailContext
  ): Promise<SuggestionResult> {
    await this.initialize();

    const systemPrompt = `
You are OptiMail, an intelligent email assistant that provides contextual suggestions. 
Your goal is to understand user intent and provide helpful, actionable suggestions.

Context Analysis:
- User input: "${input}"
- Email content: "${context.content || 'N/A'}"
- Sender: ${context.sender || 'Unknown'}
- Subject: ${context.subject || 'N/A'}
- User preferences: ${JSON.stringify(context.userPreferences || {})}

Provide:
1. Intent classification (reply, compose, schedule, translate, summarize, etc.)
2. 3-5 specific, actionable suggestions
3. Confidence score (0-1)
4. Brief context explanation

Respond in JSON format:
{
  "intent": "string",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "confidence": 0.95,
  "context": "Brief explanation of what was understood"
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        suggestions: result.suggestions || [],
        confidence: result.confidence || 0.5,
        intent: result.intent || 'unknown',
        context: result.context || 'Unable to determine context'
      };
    } catch (error) {
      console.error('GPT suggestion generation failed:', error);
      return {
        suggestions: ['Unable to generate suggestions at this time'],
        confidence: 0.1,
        intent: 'error',
        context: 'Error processing request'
      };
    }
  }

  /**
   * Generate complete email based on brief input
   */
  async generateEmail(
    briefInput: string,
    context: EmailContext
  ): Promise<{
    subject: string;
    body: string;
    tone: string;
    confidence: number;
  }> {
    await this.initialize();

    const systemPrompt = `
You are OptiMail's email generation engine. Create complete, professional emails based on brief user input.

User wants to: "${briefInput}"
Context: ${JSON.stringify(context, null, 2)}

Generate:
1. Appropriate subject line
2. Complete email body (matching user's preferred tone and length)
3. Detected tone
4. Confidence in the generation

Respond in JSON format:
{
  "subject": "Email subject",
  "body": "Complete email content",
  "tone": "professional/casual/friendly",
  "confidence": 0.95
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: briefInput }
        ],
        temperature: 0.8,
        max_tokens: 800,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        subject: result.subject || 'Generated Email',
        body: result.body || 'Unable to generate email content',
        tone: result.tone || 'professional',
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('Email generation failed:', error);
      return {
        subject: 'Error',
        body: 'Unable to generate email at this time',
        tone: 'professional',
        confidence: 0.1
      };
    }
  }

  /**
   * Analyze email for smart reply suggestions
   */
  async analyzeForReplies(emailContent: string): Promise<{
    suggestions: Array<{
      type: 'quick_reply' | 'detailed_reply' | 'meeting_request' | 'follow_up';
      text: string;
      priority: number;
    }>;
    urgency: 'low' | 'medium' | 'high';
    sentiment: 'positive' | 'neutral' | 'negative';
    keyPoints: string[];
  }> {
    await this.initialize();

    const systemPrompt = `
Analyze this email and provide smart reply suggestions with different types of responses.

Email content: "${emailContent}"

Provide:
1. Multiple reply suggestions (quick, detailed, meeting, follow-up)
2. Urgency assessment
3. Sentiment analysis
4. Key points to address

Respond in JSON format:
{
  "suggestions": [
    {
      "type": "quick_reply",
      "text": "Brief response text",
      "priority": 1
    }
  ],
  "urgency": "medium",
  "sentiment": "neutral",
  "keyPoints": ["point1", "point2"]
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: emailContent }
        ],
        temperature: 0.6,
        max_tokens: 600,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Email analysis failed:', error);
      return {
        suggestions: [
          { type: 'quick_reply', text: 'Thank you for your email', priority: 1 }
        ],
        urgency: 'medium' as const,
        sentiment: 'neutral' as const,
        keyPoints: ['Unable to analyze email content']
      };
    }
  }
}

const gptEmailAssistant = new GPTEmailAssistant();
export default gptEmailAssistant;
export type { EmailContext, SuggestionResult };
