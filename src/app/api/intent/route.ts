import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const IntentSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  context: z.object({
    thread_history: z.array(z.string()).optional(),
    user_profile: z.object({
      role: z.string().optional(),
      company: z.string().optional(),
      industry: z.string().optional()
    }).optional(),
    recent_actions: z.array(z.string()).optional()
  }).optional()
});

// Intent classification types
interface IntentResult {
  intent: string;
  confidence: number;
  sub_category?: string;
  urgency: 'low' | 'medium' | 'high';
  suggested_actions: string[];
  required_data: string[];
  routing: {
    next_endpoint: string;
    method: string;
    estimated_time: string;
  };
  fallback_available: boolean;
}

// Predefined intent patterns for fallback classification
const INTENT_PATTERNS = {
  interview_scheduling: {
    keywords: ['interview', 'schedule', 'meeting', 'available', 'time slots', 'calendar', 'appointment'],
    phrases: ['schedule an interview', 'set up a meeting', 'available for', 'book a call', 'interview time'],
    confidence_base: 0.8,
    routing: { next_endpoint: '/api/calendar/schedule', method: 'POST', estimated_time: '2-3s' },
    required_data: ['candidate_info', 'time_preferences', 'interview_type']
  },
  follow_up: {
    keywords: ['follow up', 'following up', 'check in', 'status', 'update', 'heard back', 'response'],
    phrases: ['following up on', 'checking in about', 'any updates on', 'status update', 'have you heard'],
    confidence_base: 0.75,
    routing: { next_endpoint: '/api/follow-up/create', method: 'POST', estimated_time: '1-2s' },
    required_data: ['original_context', 'follow_up_reason', 'timeline']
  },
  email_draft: {
    keywords: ['write', 'draft', 'compose', 'email', 'send', 'message', 'reach out'],
    phrases: ['draft an email', 'write a message', 'compose email', 'send email to', 'reach out to'],
    confidence_base: 0.85,
    routing: { next_endpoint: '/api/draft/compose', method: 'POST', estimated_time: '3-5s' },
    required_data: ['recipient', 'purpose', 'tone', 'key_points']
  },
  calendar_management: {
    keywords: ['calendar', 'reschedule', 'cancel', 'book', 'availability', 'busy', 'free time'],
    phrases: ['check calendar', 'reschedule meeting', 'cancel appointment', 'book time', 'availability check'],
    confidence_base: 0.8,
    routing: { next_endpoint: '/api/calendar/manage', method: 'POST', estimated_time: '1-2s' },
    required_data: ['calendar_action', 'event_details', 'new_time']
  },
  candidate_research: {
    keywords: ['research', 'background', 'profile', 'linkedin', 'experience', 'skills', 'qualifications'],
    phrases: ['research candidate', 'check background', 'candidate profile', 'look up', 'find information'],
    confidence_base: 0.7,
    routing: { next_endpoint: '/api/research/candidate', method: 'POST', estimated_time: '5-7s' },
    required_data: ['candidate_identifier', 'research_depth', 'focus_areas']
  },
  template_usage: {
    keywords: ['template', 'use template', 'standard message', 'boilerplate', 'saved draft'],
    phrases: ['use template', 'apply template', 'standard email', 'saved message', 'template for'],
    confidence_base: 0.9,
    routing: { next_endpoint: '/api/templates', method: 'GET', estimated_time: '0.5-1s' },
    required_data: ['template_category', 'customization_data']
  },
  status_inquiry: {
    keywords: ['status', 'progress', 'update', 'where are we', 'current state', 'next steps'],
    phrases: ['what\'s the status', 'progress update', 'where do we stand', 'next steps', 'current status'],
    confidence_base: 0.7,
    routing: { next_endpoint: '/api/status/check', method: 'GET', estimated_time: '1s' },
    required_data: ['context_id', 'status_type']
  },
  general_inquiry: {
    keywords: ['help', 'question', 'how to', 'what is', 'explain', 'clarify'],
    phrases: ['can you help', 'i have a question', 'how do i', 'what does', 'please explain'],
    confidence_base: 0.5,
    routing: { next_endpoint: '/api/help/general', method: 'POST', estimated_time: '1-2s' },
    required_data: ['query_type', 'context']
  }
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { text, context } = IntentSchema.parse(body);
    
    let intentResult: IntentResult;
    
    // Try Cohere API first for advanced intent classification
    try {
      if (!process.env.COHERE_API_KEY) {
        throw new Error('Cohere API key not configured');
      }
      
      const cohereResult = await classifyWithCohere(text, context);
      intentResult = cohereResult;
      
    } catch (cohereError) {
      console.warn('Cohere unavailable, using fallback classification:', cohereError);
      
      // Fallback to pattern-based classification
      intentResult = classifyWithPatterns(text);
    }
    
    const duration = Date.now() - startTime;
    
    // Log classification metrics
    try {
      console.log('Intent classification completed', {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        urgency: intentResult.urgency,
        duration_ms: duration,
        text_length: text.length,
        fallback_used: !process.env.COHERE_API_KEY || intentResult.fallback_available,
        success: true
      });
    } catch (logError) {
      console.warn('Failed to log classification metrics:', logError);
    }
    
    return NextResponse.json({
      ...intentResult,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('Intent classification error:', error);
    
    // Log error metrics
    try {
      console.log('Intent classification failed', {
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

// Intent context type
interface IntentContext {
  thread_history?: string[];
  user_profile?: {
    role?: string;
    company?: string;
    industry?: string;
  };
  recent_actions?: string[];
}

// Advanced intent classification using Cohere
async function classifyWithCohere(text: string, context?: IntentContext): Promise<IntentResult> {
  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      message: `Analyze this text and determine the user's primary intent in the context of OptiMail (email management and recruitment tool).

Text: "${text}"
${context ? `Context: ${JSON.stringify(context)}` : ''}

Available intents:
- interview_scheduling: Scheduling interviews or meetings
- follow_up: Following up on communications or status
- email_draft: Composing or drafting emails
- calendar_management: Managing calendar events
- candidate_research: Researching candidates or contacts
- template_usage: Using or managing email templates
- status_inquiry: Checking status or progress
- general_inquiry: General questions or help

Respond with JSON:
{
  "intent": "intent_name",
  "confidence": 0.85,
  "sub_category": "optional_subcategory",
  "urgency": "low|medium|high",
  "reasoning": "Brief explanation"
}`,
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Cohere classification failed: ${errorData.message}`);
  }
  
  const cohereData = await response.json();
  const classification = JSON.parse(cohereData.text || cohereData.message || '{}');
  
  const intent = classification.intent || 'general_inquiry';
  const confidence = Math.min(Math.max(classification.confidence || 0.5, 0), 1);
  
  // Get pattern data for additional context
  const patternData = INTENT_PATTERNS[intent as keyof typeof INTENT_PATTERNS] || INTENT_PATTERNS.general_inquiry;
  
  return {
    intent,
    confidence,
    sub_category: classification.sub_category || determineSubCategory(intent, text),
    urgency: classification.urgency || determineUrgency(text),
    suggested_actions: generateSuggestedActions(intent),
    required_data: patternData.required_data,
    routing: patternData.routing,
    fallback_available: false
  };
}

// Pattern-based fallback classification
function classifyWithPatterns(text: string): IntentResult {
  const lowerText = text.toLowerCase();
  let bestMatch = { intent: 'general_inquiry', confidence: 0.3 };
  
  // Score each intent pattern
  for (const [intentName, pattern] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    
    // Check keyword matches
    const keywordMatches = pattern.keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    ).length;
    score += (keywordMatches / pattern.keywords.length) * 0.6;
    
    // Check phrase matches
    const phraseMatches = pattern.phrases.filter(phrase => 
      lowerText.includes(phrase.toLowerCase())
    ).length;
    score += (phraseMatches / pattern.phrases.length) * 0.4;
    
    // Apply base confidence
    const finalScore = score * pattern.confidence_base;
    
    if (finalScore > bestMatch.confidence) {
      bestMatch = { intent: intentName, confidence: finalScore };
    }
  }
  
  const patternData = INTENT_PATTERNS[bestMatch.intent as keyof typeof INTENT_PATTERNS];
  
  return {
    intent: bestMatch.intent,
    confidence: Math.min(bestMatch.confidence, 0.9), // Cap confidence for pattern matching
    sub_category: determineSubCategory(bestMatch.intent, text),
    urgency: determineUrgency(text),
    suggested_actions: generateSuggestedActions(bestMatch.intent),
    required_data: patternData.required_data,
    routing: patternData.routing,
    fallback_available: true
  };
}

// Determine sub-category based on intent and context
function determineSubCategory(intent: string, text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  switch (intent) {
    case 'interview_scheduling':
      if (lowerText.includes('phone') || lowerText.includes('call')) return 'phone_interview';
      if (lowerText.includes('video') || lowerText.includes('zoom') || lowerText.includes('teams')) return 'video_interview';
      if (lowerText.includes('onsite') || lowerText.includes('office')) return 'onsite_interview';
      return 'general_interview';
      
    case 'follow_up':
      if (lowerText.includes('urgent') || lowerText.includes('asap')) return 'urgent_followup';
      if (lowerText.includes('decision') || lowerText.includes('feedback')) return 'decision_followup';
      return 'standard_followup';
      
    case 'email_draft':
      if (lowerText.includes('rejection') || lowerText.includes('decline')) return 'rejection_email';
      if (lowerText.includes('offer') || lowerText.includes('congratulations')) return 'offer_email';
      if (lowerText.includes('invitation') || lowerText.includes('invite')) return 'invitation_email';
      return 'general_email';
      
    default:
      return undefined;
  }
}

// Determine urgency based on text patterns
function determineUrgency(text: string): 'low' | 'medium' | 'high' {
  const lowerText = text.toLowerCase();
  
  // High urgency indicators
  const highUrgencyPatterns = [
    'urgent', 'asap', 'immediately', 'today', 'now', 'emergency',
    'critical', 'deadline', 'expires', 'time sensitive'
  ];
  
  // Medium urgency indicators
  const mediumUrgencyPatterns = [
    'soon', 'this week', 'by friday', 'by tomorrow', 'follow up',
    'waiting', 'pending', 'quick question'
  ];
  
  if (highUrgencyPatterns.some(pattern => lowerText.includes(pattern))) {
    return 'high';
  }
  
  if (mediumUrgencyPatterns.some(pattern => lowerText.includes(pattern))) {
    return 'medium';
  }
  
  return 'low';
}

// Generate contextual suggested actions
function generateSuggestedActions(intent: string): string[] {
  const baseActions: { [key: string]: string[] } = {
    interview_scheduling: [
      'Check calendar availability',
      'Prepare interview questions',
      'Send calendar invitation',
      'Confirm interview format and logistics'
    ],
    follow_up: [
      'Review previous communication',
      'Set follow-up reminder',
      'Prepare status update',
      'Schedule next touchpoint'
    ],
    email_draft: [
      'Choose appropriate template',
      'Customize message tone',
      'Review recipient context',
      'Schedule send time'
    ],
    calendar_management: [
      'Check current availability',
      'Review conflicting events',
      'Send meeting updates',
      'Block focus time'
    ],
    candidate_research: [
      'Review LinkedIn profile',
      'Check references',
      'Analyze skills match',
      'Prepare interview questions'
    ],
    template_usage: [
      'Browse available templates',
      'Customize template variables',
      'Preview final message',
      'Save personalized version'
    ],
    general_inquiry: [
      'Clarify specific needs',
      'Provide relevant resources',
      'Suggest next steps',
      'Schedule follow-up if needed'
    ]
  };
  
  return baseActions[intent] || baseActions.general_inquiry;
}
