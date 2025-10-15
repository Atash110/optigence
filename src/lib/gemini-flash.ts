/**
 * Google Gemini 1.5 Flash API Integration
 * Handles entity extraction and fast AI operations for OptiMail
 */

interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiFlashService {
  private config: GeminiConfig;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required');
    }

    this.config = {
      apiKey,
      model: 'gemini-1.5-flash-latest',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
    };
  }

  private async makeRequest(request: GeminiRequest): Promise<GeminiResponse> {
    const url = `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Extract entities from email content with structured output
   */
  async extractEmailEntities(emailContent: string): Promise<{
    entities: Record<string, string | string[] | boolean>;
    summary: string;
    tone: string;
    confidence: number;
  }> {
    const prompt = `Analyze this email content and extract structured information. Return ONLY valid JSON with this exact structure:

{
  "entities": {
    "sender": "email or name",
    "recipient": "email or name", 
    "dates": ["date1", "date2"],
    "times": ["time1", "time2"],
    "locations": ["location1", "location2"],
    "topics": ["topic1", "topic2"],
    "urgency": "low|medium|high",
    "meeting_request": true/false,
    "action_items": ["item1", "item2"]
  },
  "summary": "one sentence summary",
  "tone": "professional|casual|urgent|friendly|formal",
  "confidence": 0.85
}

Email content:
${emailContent.slice(0, 4000)}`;

    try {
      const request: GeminiRequest = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 800,
          topP: 0.95
        }
      };

      const response = await this.makeRequest(request);
      const content = response.candidates[0]?.content?.parts[0]?.text;

      if (!content) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON response
      const parsed = JSON.parse(content.trim());
      
      return {
        entities: parsed.entities || {},
        summary: parsed.summary || 'Email content analyzed',
        tone: parsed.tone || 'professional',
        confidence: parsed.confidence || 0.8
      };
    } catch (error) {
      console.error('Gemini entity extraction error:', error);
      
      // Fallback to basic extraction
      return {
        entities: {
          urgency: emailContent.toLowerCase().includes('urgent') ? 'high' : 'medium',
          meeting_request: /meeting|schedule|appointment/i.test(emailContent),
          topics: [],
          action_items: []
        },
        summary: 'Email processed with fallback extraction',
        tone: 'professional',
        confidence: 0.5
      };
    }
  }

  /**
   * Generate contextual summary with bullet points
   */
  async summarizeContent(content: string): Promise<{
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    tldr: string;
  }> {
    const prompt = `Summarize this content in the following JSON format:

{
  "summary": "Brief 2-3 sentence overview",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "actionItems": ["Action 1", "Action 2"],
  "tldr": "One line essence"
}

Content:
${content.slice(0, 6000)}`;

    try {
      const request: GeminiRequest = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500,
          topP: 0.9
        }
      };

      const response = await this.makeRequest(request);
      const responseText = response.candidates[0]?.content?.parts[0]?.text;

      if (!responseText) {
        throw new Error('No response from Gemini API');
      }

      const parsed = JSON.parse(responseText.trim());
      
      return {
        summary: parsed.summary || 'Content summarized',
        keyPoints: parsed.keyPoints || [],
        actionItems: parsed.actionItems || [],
        tldr: parsed.tldr || 'Key content processed'
      };
    } catch (error) {
      console.error('Gemini summarization error:', error);
      
      return {
        summary: 'Content summarized using fallback',
        keyPoints: ['Key information extracted', 'Content processed'],
        actionItems: [],
        tldr: 'Summary generated'
      };
    }
  }

  /**
   * Classify intent with confidence scoring
   */
  async classifyIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    secondary: string[];
    reasoning: string;
  }> {
    const prompt = `Classify the intent of this text. Return JSON in this exact format:

{
  "intent": "reply|compose|summarize|translate|schedule|template|travel|shopping|assistance",
  "confidence": 0.85,
  "secondary": ["intent2", "intent3"],
  "reasoning": "Brief explanation of classification"
}

Text to classify:
${text.slice(0, 2000)}`;

    try {
      const request: GeminiRequest = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
          topP: 0.8
        }
      };

      const response = await this.makeRequest(request);
      const responseText = response.candidates[0]?.content?.parts[0]?.text;

      if (!responseText) {
        throw new Error('No response from Gemini API');
      }

      const parsed = JSON.parse(responseText.trim());
      
      return {
        intent: parsed.intent || 'assistance',
        confidence: Math.min(parsed.confidence || 0.7, 0.95),
        secondary: parsed.secondary || [],
        reasoning: parsed.reasoning || 'Classified using AI analysis'
      };
    } catch (error) {
      console.error('Gemini intent classification error:', error);
      
      // Fallback to pattern matching
      let intent = 'assistance';
      let confidence = 0.6;

      if (/reply|respond|answer/i.test(text)) {
        intent = 'reply';
        confidence = 0.8;
      } else if (/schedule|meeting|calendar/i.test(text)) {
        intent = 'schedule';
        confidence = 0.8;
      } else if (/summarize|summary/i.test(text)) {
        intent = 'summarize';
        confidence = 0.8;
      }

      return {
        intent,
        confidence,
        secondary: [],
        reasoning: 'Classified using pattern matching fallback'
      };
    }
  }

  /**
   * Test the Gemini API connection
   */
  async testConnection(): Promise<{
    success: boolean;
    latency: number;
    model: string;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      const request: GeminiRequest = {
        contents: [{
          parts: [{ text: 'Test connection - respond with "OK"' }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      };

      const response = await this.makeRequest(request);
      const latency = Date.now() - start;
      const content = response.candidates[0]?.content?.parts[0]?.text;

      return {
        success: !!content,
        latency,
        model: this.config.model
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - start,
        model: this.config.model,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract meeting details from email content
   */
  async extractMeetingDetails(emailContent: string): Promise<{
    hasMeeting: boolean;
    title?: string;
    participants?: string[];
    suggestedTimes?: string[];
    duration?: number;
    location?: string;
    agenda?: string[];
  }> {
    const prompt = `Extract meeting information from this email. Return JSON:

{
  "hasMeeting": true/false,
  "title": "Meeting title",
  "participants": ["email1", "email2"],
  "suggestedTimes": ["2025-01-15 14:00", "2025-01-16 10:00"],
  "duration": 60,
  "location": "Room 123 or Zoom link",
  "agenda": ["Topic 1", "Topic 2"]
}

Email:
${emailContent.slice(0, 4000)}`;

    try {
      const request: GeminiRequest = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 600
        }
      };

      const response = await this.makeRequest(request);
      const responseText = response.candidates[0]?.content?.parts[0]?.text;

      if (!responseText) {
        return { hasMeeting: false };
      }

      const parsed = JSON.parse(responseText.trim());
      return parsed;
    } catch (error) {
      console.error('Meeting extraction error:', error);
      
      // Fallback detection
      const hasMeeting = /meeting|schedule|appointment|call|zoom|teams/i.test(emailContent);
      return {
        hasMeeting,
        title: hasMeeting ? 'Meeting Discussion' : undefined,
        duration: 30
      };
    }
  }
}

// Export singleton instance
export const geminiFlash = new GeminiFlashService();
export default geminiFlash;
