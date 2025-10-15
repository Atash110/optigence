// Intent classification using Cohere API with local fallbacks
import { OptiMailIntent } from '@/types/optimail';

interface IntentResult {
  intent: OptiMailIntent;
  confidence: number;
  reasoning: string;
}

interface CohereClassification {
  intent: string;
  confidence: number;
}

// Cohere classification labels
const INTENT_LABELS = [
  'reply',
  'summarize', 
  'translate',
  'calendar',
  'template',
  'route_trip',
  'route_shop',
  'route_hire'
] as const;

// Local pattern matching for fallback
const PATTERNS = {
  reply: [/reply/i, /respond/i, /answer/i, /back to/i],
  summarize: [/summary/i, /summarize/i, /tldr/i, /brief/i],
  translate: [/translate/i, /in (spanish|french|german|chinese)/i],
  calendar: [/schedule/i, /meeting/i, /book/i, /calendar/i, /appointment/i],
  template: [/save.*template/i, /template/i, /reuse/i],
  route_trip: [/flight/i, /hotel/i, /travel/i, /vacation/i, /trip/i],
  route_shop: [/buy/i, /purchase/i, /order/i, /shop/i, /product/i],
  route_hire: [/job/i, /hire/i, /interview/i, /resume/i, /career/i],
  compose: [/write/i, /email/i, /send/i, /compose/i] // default fallback
} as const;

// Cache for results within the same session
const cache = new Map<string, IntentResult>();

async function classifyWithCohere(text: string): Promise<CohereClassification | null> {
  try {
    if (!process.env.COHERE_API_KEY) {
      console.warn('Cohere API key not configured');
      return null;
    }

    const response = await fetch('https://api.cohere.ai/v1/classify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [text],
        examples: [
          // Training examples for each intent
          { text: "reply to John's email", label: "reply" },
          { text: "respond to the meeting request", label: "reply" },
          { text: "summarize this thread", label: "summarize" },
          { text: "give me a summary", label: "summarize" },
          { text: "translate to spanish", label: "translate" },
          { text: "schedule a meeting", label: "calendar" },
          { text: "book appointment", label: "calendar" },
          { text: "save as template", label: "template" },
          { text: "flight to paris", label: "route_trip" },
          { text: "buy new laptop", label: "route_shop" },
          { text: "job application", label: "route_hire" },
        ]
      })
    });

    if (!response.ok) throw new Error(`Cohere API error: ${response.status}`);
    
    const data = await response.json();
    const classification = data.classifications?.[0];
    
    if (classification) {
      return {
        intent: classification.prediction,
        confidence: classification.confidence
      };
    }
  } catch (error) {
    console.error('Cohere classification error:', error);
  }
  
  return null;
}

function classifyLocally(text: string): IntentResult {
  const lowercaseText = text.toLowerCase();
  
  for (const [intent, patterns] of Object.entries(PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowercaseText)) {
        return {
          intent: intent as OptiMailIntent,
          confidence: 0.75, // Lower confidence for pattern matching
          reasoning: `Matched pattern: ${pattern.source}`
        };
      }
    }
  }
  
  // Default to compose with lower confidence
  return {
    intent: 'compose',
    confidence: 0.5,
    reasoning: 'Default intent - no specific patterns matched'
  };
}

export async function classifyIntent(text: string): Promise<IntentResult> {
  const cacheKey = text.trim().toLowerCase();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  let result: IntentResult;
  
  try {
    // Try Cohere first
    const cohereResult = await classifyWithCohere(text);
    
    if (cohereResult && cohereResult.confidence > 0.6) {
      result = {
        intent: cohereResult.intent as OptiMailIntent,
        confidence: cohereResult.confidence,
        reasoning: 'Classified by Cohere AI'
      };
    } else {
      // Fall back to local patterns
      result = classifyLocally(text);
    }
  } catch (error) {
    console.error('Intent classification error:', error);
    result = classifyLocally(text);
  }
  
  // Cache the result
  cache.set(cacheKey, result);
  
  return result;
}

// Clear cache (useful for testing or memory management)
export function clearIntentCache(): void {
  cache.clear();
}
