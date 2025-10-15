import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CohereClient } from 'cohere-ai';

// LLM Configuration
export interface LLMConfig {
  openai: {
    apiKey: string;
    model: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
  };
  google: {
    apiKey: string;
    model: string;
  };
  cohere: {
    apiKey: string;
    model: string;
  };
}

export class HybridLLMClients {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private google: GoogleGenerativeAI;
  private cohere: CohereClient;

  constructor(config: LLMConfig) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      dangerouslyAllowBrowser: true
    });

    this.anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey,
      dangerouslyAllowBrowser: true
    });

    this.google = new GoogleGenerativeAI(config.google.apiKey);

    this.cohere = new CohereClient({
      token: config.cohere.apiKey,
    });
  }

  // OpenAI GPT-4 Turbo - General Intelligence, Composition, Summarization
  async callOpenAI(messages: any[], systemPrompt?: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI Error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  // Anthropic Claude 3 - Enhanced Contextual Understanding, Long-Context Email Threads
  async callClaude(messages: any[], systemPrompt?: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt || '',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      return response.content[0]?.type === 'text' ? response.content[0].text : '';
    } catch (error) {
      console.error('Claude Error:', error);
      throw new Error('Failed to generate response from Claude');
    }
  }

  // Google Gemini 1.5 Pro - Real-time Search & World Knowledge Integration
  async callGemini(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const model = this.google.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Gemini Error:', error);
      throw new Error('Failed to generate response from Gemini');
    }
  }

  // Cohere Command R+ - Predictive Automation & Advanced Intent Classification
  async callCohere(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.cohere.chat({
        model: 'command-r-plus',
        message: prompt,
        preamble: systemPrompt,
        maxTokens: 2000,
        temperature: 0.7,
      });

      return response.text || '';
    } catch (error) {
      console.error('Cohere Error:', error);
      throw new Error('Failed to generate response from Cohere');
    }
  }
}

// Enhanced Intent Classification using Cohere
export interface IntentClassification {
  intent: string;
  confidence: number;
  suggestedLLM: 'openai' | 'claude' | 'gemini' | 'cohere';
  context: {
    urgency: 'low' | 'medium' | 'high';
    complexity: 'simple' | 'moderate' | 'complex';
    emotionalTone: 'neutral' | 'positive' | 'negative' | 'mixed';
    needsRealTimeInfo: boolean;
  };
}

export class AdvancedIntentClassifier {
  private cohereClient: CohereClient;

  constructor(cohereApiKey: string) {
    this.cohereClient = new CohereClient({
      token: cohereApiKey,
    });
  }

  async classifyIntent(input: string): Promise<IntentClassification> {
    try {
      // Use Cohere for intent classification
      const classificationPrompt = `
Analyze this email request and classify the intent with context:

Input: "${input}"

Classify the intent and provide context analysis in JSON format:
{
  "intent": "compose|reply|summarize|rewrite|schedule|follow_up|apology|thank_you|introduction|complaint|request|other",
  "confidence": 0.0-1.0,
  "suggestedLLM": "openai|claude|gemini|cohere",
  "context": {
    "urgency": "low|medium|high",
    "complexity": "simple|moderate|complex", 
    "emotionalTone": "neutral|positive|negative|mixed",
    "needsRealTimeInfo": true|false
  }
}

LLM Selection Guidelines:
- OpenAI: General composition, summarization, creative writing
- Claude: Long context, complex analysis, nuanced understanding
- Gemini: Real-time info, current events, factual queries
- Cohere: Intent classification, predictive automation, pattern recognition
`;

      const response = await this.cohereClient.chat({
        model: 'command-r-plus',
        message: classificationPrompt,
        maxTokens: 500,
        temperature: 0.1,
      });

      try {
        const parsed = JSON.parse(response.text || '{}');
        return {
          intent: parsed.intent || 'other',
          confidence: parsed.confidence || 0.5,
          suggestedLLM: parsed.suggestedLLM || 'openai',
          context: {
            urgency: parsed.context?.urgency || 'medium',
            complexity: parsed.context?.complexity || 'moderate',
            emotionalTone: parsed.context?.emotionalTone || 'neutral',
            needsRealTimeInfo: parsed.context?.needsRealTimeInfo || false
          }
        };
      } catch (parseError) {
        // Fallback classification
        return this.fallbackClassification(input);
      }
    } catch (error) {
      console.error('Intent classification error:', error);
      return this.fallbackClassification(input);
    }
  }

  private fallbackClassification(input: string): IntentClassification {
    const lowerInput = input.toLowerCase();
    
    let intent = 'other';
    let suggestedLLM: 'openai' | 'claude' | 'gemini' | 'cohere' = 'openai';
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
    let emotionalTone: 'neutral' | 'positive' | 'negative' | 'mixed' = 'neutral';
    let needsRealTimeInfo = false;

    // Intent detection
    if (lowerInput.includes('follow up') || lowerInput.includes('follow-up')) {
      intent = 'follow_up';
      suggestedLLM = 'openai';
    } else if (lowerInput.includes('thank') || lowerInput.includes('gratitude')) {
      intent = 'thank_you';
      emotionalTone = 'positive';
      suggestedLLM = 'claude';
    } else if (lowerInput.includes('apolog') || lowerInput.includes('sorry')) {
      intent = 'apology';
      emotionalTone = 'negative';
      suggestedLLM = 'claude';
      complexity = 'complex';
    } else if (lowerInput.includes('summar') || lowerInput.includes('digest')) {
      intent = 'summarize';
      suggestedLLM = 'claude';
      complexity = 'complex';
    } else if (lowerInput.includes('reply') || lowerInput.includes('respond')) {
      intent = 'reply';
      suggestedLLM = 'claude';
    } else if (lowerInput.includes('rewrite') || lowerInput.includes('improve')) {
      intent = 'rewrite';
      suggestedLLM = 'openai';
    } else if (lowerInput.includes('schedule') || lowerInput.includes('meeting')) {
      intent = 'schedule';
      suggestedLLM = 'gemini';
      needsRealTimeInfo = true;
    } else if (lowerInput.includes('urgent') || lowerInput.includes('asap') || lowerInput.includes('immediately')) {
      urgency = 'high';
    }

    // Emotional tone detection
    if (lowerInput.includes('angry') || lowerInput.includes('frustrated') || lowerInput.includes('disappointed')) {
      emotionalTone = 'negative';
    } else if (lowerInput.includes('excited') || lowerInput.includes('pleased') || lowerInput.includes('happy')) {
      emotionalTone = 'positive';
    }

    // Real-time info detection
    if (lowerInput.includes('current') || lowerInput.includes('latest') || lowerInput.includes('recent') || lowerInput.includes('news')) {
      needsRealTimeInfo = true;
      suggestedLLM = 'gemini';
    }

    return {
      intent,
      confidence: 0.7,
      suggestedLLM,
      context: {
        urgency,
        complexity,
        emotionalTone,
        needsRealTimeInfo
      }
    };
  }
}
