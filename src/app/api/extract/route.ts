import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Simple in-memory cache with TTL for extraction results
interface ExtractionCacheEntry {
  result: {
    ask: string;
    constraints: string[];
    people: Array<{ name: string; email?: string; role?: string }>;
    dates_times: Array<{ text: string; parsed?: string | null; type?: string }>;
    locations: Array<{ text: string; type?: string }>;
    language: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
    topics: string[];
    action_items: string[];
    model_used: string;
    duration_ms: number;
  };
  timestamp: number;
}

const extractionCache = new Map<string, ExtractionCacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

// Strip quoted email text and signatures from long threads
function stripQuotedText(input: string): string {
  let text = input;
  
  // Common email reply separators and quoted content patterns
  const quotedPatterns = [
    /\nOn .* wrote:\n[\s\S]*/i,                    // "On [date] [person] wrote:"
    /\nFrom: .*\nSent: .*\nTo: .*\nSubject: .*[\s\S]*/i, // Outlook-style headers
    /\n> .*/g,                                      // Line-by-line quotes (> text)
    /\n-----Original Message-----[\s\S]*/i,        // Outlook original message
    /\n-- ?\n[\s\S]*/,                             // Email signatures (-- separator)
    /\n_{10,}[\s\S]*/,                             // Long underline separators
    /\n\[cid:.*?\][\s\S]*/g,                       // Embedded images/content IDs
  ];
  
  for (const pattern of quotedPatterns) {
    text = text.replace(pattern, '\n');
  }
  
  // Collapse excessive whitespace while preserving paragraph breaks
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  
  // If text is still very long, keep only first 2000 chars for extraction
  if (text.length > 2000) {
    text = text.substring(0, 2000) + '...';
  }
  
  return text;
}

// Input validation schema
const ExtractionSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  threadContext: z.string().optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, threadContext } = ExtractionSchema.parse(body);

    // Check cache first
    const cacheKey = Buffer.from(text).toString('base64');
    const cached = extractionCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      return NextResponse.json({
        ...cached.result,
        cached: true
      });
    }

    // Strip quoted content for performance unless it contains scheduling info
    const processedText = stripQuotedText(text);

    // Prepare structured prompt for Gemini 1.5 Flash
    const prompt = `Extract structured information from this text. Consider thread context if provided.

Text: "${processedText}"
${threadContext ? `Thread Context: "${threadContext}"` : ''}

Extract and return JSON with these fields:
{
  "ask": "What the user is asking for or wants to accomplish",
  "constraints": ["Any specific requirements, preferences, or limitations"],
  "people": [{"name": "person name", "email": "email if mentioned", "role": "their relationship/role"}],
  "dates_times": [{"text": "original text", "parsed": "ISO format if parseable", "type": "deadline|meeting|event"}],
  "locations": [{"text": "location mentioned", "type": "venue|address|city"}],
  "language": "detected language code (en, es, fr, etc.)",
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high",
  "topics": ["main topics or keywords"],
  "action_items": ["specific actions needed"]
}

Be precise. If a field has no relevant information, use empty array [] or null. For dates/times, try to parse common formats but keep original text too.`;

    // Call Gemini 1.5 Flash API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.1,
          topP: 0.8,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Gemini Extraction Error:', errorData);
      
      return NextResponse.json(
        { error: `Entity extraction failed: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const geminiData = await response.json();
    const duration = Date.now() - startTime;

    let extractionResult;
    try {
      // Parse Gemini's response
      const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from the response (handle markdown formatting)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractionResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.error('Failed to parse Gemini response:', geminiData);
      
      // Fallback: basic extraction
      extractionResult = extractEntitiesFallback(text);
    }

    // Normalize and validate the response
    const normalizedResult = {
      ask: extractionResult.ask || 'General inquiry',
      constraints: Array.isArray(extractionResult.constraints) ? extractionResult.constraints : [],
      people: Array.isArray(extractionResult.people) ? extractionResult.people : [],
      dates_times: Array.isArray(extractionResult.dates_times) ? extractionResult.dates_times : [],
      locations: Array.isArray(extractionResult.locations) ? extractionResult.locations : [],
      language: extractionResult.language || detectLanguage(text),
      sentiment: ['positive', 'neutral', 'negative'].includes(extractionResult.sentiment) 
        ? extractionResult.sentiment : 'neutral',
      urgency: ['low', 'medium', 'high'].includes(extractionResult.urgency) 
        ? extractionResult.urgency : 'medium',
      topics: Array.isArray(extractionResult.topics) ? extractionResult.topics : [],
      action_items: Array.isArray(extractionResult.action_items) ? extractionResult.action_items : [],
      model_used: 'gemini-1.5-flash-latest',
      duration_ms: duration
    };

    // Cache the result
    extractionCache.set(cacheKey, {
      result: normalizedResult,
      timestamp: Date.now()
    });

    // Log metrics (without sensitive data)
    try {
      console.log('Entity extraction completed', {
        language: normalizedResult.language,
        sentiment: normalizedResult.sentiment,
        urgency: normalizedResult.urgency,
        people_count: normalizedResult.people.length,
        dates_count: normalizedResult.dates_times.length,
        duration_ms: duration,
        text_length: text.length,
        processed_length: processedText.length,
        success: true
      });
    } catch (logError) {
      console.warn('Failed to log extraction metrics:', logError);
    }

    return NextResponse.json(normalizedResult);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('Entity extraction error:', error);
    
    // Log error metrics
    try {
      console.log('Entity extraction failed', {
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } catch (logError) {
      console.warn('Failed to log error metrics:', logError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback entity extraction using regex and keywords
function extractEntitiesFallback(text: string) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const dateRegex = /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi;
  
  const emails = Array.from(text.matchAll(emailRegex)).map(match => match[0]);
  const dates = Array.from(text.matchAll(dateRegex)).map(match => match[0]);
  
  return {
    ask: text.length > 100 ? text.substring(0, 100) + '...' : text,
    constraints: [],
    people: emails.map(email => ({ name: email.split('@')[0], email, role: 'contact' })),
    dates_times: dates.map(date => ({ text: date, parsed: null, type: 'event' })),
    locations: [],
    language: detectLanguage(text),
    sentiment: 'neutral',
    urgency: 'medium',
    topics: [],
    action_items: []
  };
}

// Simple language detection
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Simple heuristics for common languages
  if (/\b(the|and|or|is|are|was|were|have|has|had|will|would|could|should)\b/.test(lowerText)) {
    return 'en';
  } else if (/\b(el|la|es|son|tiene|con|para|por|que|pero)\b/.test(lowerText)) {
    return 'es';
  } else if (/\b(le|la|et|est|sont|avec|pour|par|que|mais)\b/.test(lowerText)) {
    return 'fr';
  } else if (/\b(der|die|das|ist|sind|hat|mit|für|von|zu|aber)\b/.test(lowerText)) {
    return 'de';
  }
  
  return 'en'; // Default to English
}
