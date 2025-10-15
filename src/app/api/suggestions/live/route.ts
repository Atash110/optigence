import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit';
import { config } from '@/lib/config';
import { LiveSuggestionEngine, SuggestionContext } from '@/lib/optimail/live-suggestions';

async function handler(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const {
      userInput,
      intent,
      confidence,
      extraction,
      userProfile,
      contactProfile,
      threadContext,
      calendarContext
    } = body;

    // Validate required fields
    if (!userInput || !intent || typeof confidence !== 'number') {
      return NextResponse.json({
        error: 'Missing required fields: userInput, intent, confidence',
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    // Build suggestion context
    const context: SuggestionContext = {
      userInput,
      intent,
      confidence,
      extraction: extraction || {
        ask: userInput,
        sentiment: 'neutral',
        urgency: 'medium',
        topics: [],
        language: 'en'
      },
      userProfile,
      contactProfile,
      threadContext,
      calendarContext
    };

    // Generate live suggestions
    const startTime = Date.now();
    const result = await LiveSuggestionEngine.generateSuggestions(context);
    const totalProcessingTime = Date.now() - startTime;

    // Return the suggestions with metadata
    return NextResponse.json({
      ...result,
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        totalProcessingTime,
        context: {
          userInput: userInput.slice(0, 100) + (userInput.length > 100 ? '...' : ''),
          intent,
          confidence,
          hasUserProfile: !!userProfile,
          hasContactProfile: !!contactProfile,
          hasThreadContext: !!threadContext,
          hasCalendarContext: !!calendarContext
        }
      }
    });

  } catch (error) {
    console.error('Live suggestions API error:', error);
    
    return NextResponse.json({
      error: 'Failed to generate suggestions',
      code: 'SUGGESTION_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export the handler with rate limiting (AI service tier)
export const POST = withRateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 30, // 30 suggestions per minute
  keyGenerator: (req) => {
    // Rate limit per IP for suggestions
    return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  }
})(handler);

export const GET = async () => {
  return NextResponse.json({
    service: 'OptiMail Live Suggestions',
    version: '1.0.0',
    status: 'active',
    description: 'Contextual AI-driven suggestion pipeline',
    features: [
      'Intent-based core suggestions',
      'Contextual enhancements',
      'User profile personalization',
      'Cross-module routing',
      'Confidence-based ranking',
      'Real-time processing'
    ],
    endpoints: {
      'POST /': 'Generate live suggestions based on context',
      'GET /': 'Service information'
    },
    configuration: {
      serviceEnabled: config.config.OPENAI_API_KEY ? true : false,
      rateLimitTier: 'ai',
      maxSuggestions: 6,
      fallbackEnabled: true
    }
  });
};
