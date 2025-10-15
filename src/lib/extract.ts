// Entity extraction using Gemini Flash with structured output
interface ExtractedEntities {
  ask: string;
  constraints: string[];
  attendees: string[];
  dates: string[];
  places: string[];
  tone: 'professional' | 'casual' | 'urgent' | 'friendly';
  priority: 'low' | 'medium' | 'high';
}

interface ExtractionResult {
  entities: ExtractedEntities;
  summary: string;
  confidence: number;
}

// Cache for extraction results
const extractionCache = new Map<string, ExtractionResult>();

async function extractWithGemini(text: string): Promise<ExtractionResult | null> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return null;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract key information from this email request and return valid JSON only:

"${text}"

Return this exact JSON structure:
{
  "entities": {
    "ask": "main request in one sentence",
    "constraints": ["time constraints", "other requirements"],
    "attendees": ["person1@email.com", "Person Name"],
    "dates": ["tomorrow", "next week", "specific dates"],
    "places": ["locations mentioned"],
    "tone": "professional|casual|urgent|friendly",
    "priority": "low|medium|high"
  },
  "summary": "concise one-line summary",
  "confidence": 0.85
}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (content) {
      // Clean up the response to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return extracted;
      }
    }
  } catch (error) {
    console.error('Gemini extraction error:', error);
  }
  
  return null;
}

function extractLocally(text: string): ExtractionResult {
  const lowercaseText = text.toLowerCase();
  
  // Extract emails
  const emailPattern = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
  const emails = text.match(emailPattern) || [];
  
  // Extract common names (simple heuristic)
  const namePattern = /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g;
  const names = text.match(namePattern) || [];
  
  // Extract dates
  const dateKeywords = ['tomorrow', 'next week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dates = dateKeywords.filter(keyword => lowercaseText.includes(keyword));
  
  // Detect tone
  let tone: ExtractedEntities['tone'] = 'professional';
  if (/urgent|asap|immediately/i.test(text)) tone = 'urgent';
  else if (/hi|hey|thanks/i.test(text)) tone = 'friendly';
  else if (/quick|brief/i.test(text)) tone = 'casual';
  
  // Detect priority
  let priority: ExtractedEntities['priority'] = 'medium';
  if (/urgent|asap|important/i.test(text)) priority = 'high';
  else if (/whenever|no rush/i.test(text)) priority = 'low';
  
  const entities: ExtractedEntities = {
    ask: text.split('.')[0] || text, // First sentence as main ask
    constraints: [],
    attendees: [...emails, ...names],
    dates,
    places: [], // Would need more sophisticated NLP
    tone,
    priority
  };
  
  return {
    entities,
    summary: `Request: ${entities.ask}`,
    confidence: 0.6 // Lower confidence for local extraction
  };
}

export async function extractEntities(text: string): Promise<ExtractionResult> {
  const cacheKey = text.trim();
  
  // Check cache
  if (extractionCache.has(cacheKey)) {
    return extractionCache.get(cacheKey)!;
  }
  
  let result: ExtractionResult;
  
  try {
    // Try Gemini first
    const geminiResult = await extractWithGemini(text);
    
    if (geminiResult && geminiResult.confidence > 0.7) {
      result = geminiResult;
    } else {
      // Fall back to local extraction
      result = extractLocally(text);
    }
  } catch (error) {
    console.error('Entity extraction error:', error);
    result = extractLocally(text);
  }
  
  // Cache the result
  extractionCache.set(cacheKey, result);
  
  return result;
}

export function clearExtractionCache(): void {
  extractionCache.clear();
}
