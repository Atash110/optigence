import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const HandoffSchema = z.object({
  intent: z.string(),
  extraction: z.object({
    ask: z.string(),
    topics: z.array(z.string()).optional(),
    people: z.array(z.any()).optional(),
    dates_times: z.array(z.any()).optional(),
    locations: z.array(z.any()).optional(),
    constraints: z.array(z.string()).optional()
  }),
  confidence: z.number().min(0).max(1),
  originalText: z.string()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { intent, extraction, confidence, originalText } = HandoffSchema.parse(body);

    // Only handle routing intents
    const routingIntents = ['route_trip', 'route_shop', 'route_hire'];
    if (!routingIntents.includes(intent)) {
      return NextResponse.json(
        { error: 'Intent does not require routing', intent },
        { status: 400 }
      );
    }

    // Generate deep-link payload based on intent
    const handoffPayload = generateHandoffPayload(intent, extraction, originalText);
    
    const duration = Date.now() - startTime;

    // Log routing metrics
    try {
      console.log('Router handoff completed', {
        intent,
        target_module: handoffPayload.module,
        confidence,
        topics_count: extraction.topics?.length || 0,
        duration_ms: duration,
        success: true
      });
    } catch (logError) {
      console.warn('Failed to log routing metrics:', logError);
    }

    return NextResponse.json({
      handoff: {
        module: handoffPayload.module,
        deep_link: handoffPayload.deep_link,
        prefilled_data: handoffPayload.prefilled_data,
        confidence,
        suggested_actions: handoffPayload.suggested_actions
      },
      metadata: {
        intent,
        duration_ms: duration,
        original_text_length: originalText.length,
        extracted_entities: {
          topics: extraction.topics?.length || 0,
          people: extraction.people?.length || 0,
          dates: extraction.dates_times?.length || 0,
          locations: extraction.locations?.length || 0
        }
      },
      ui_suggestions: {
        button_text: handoffPayload.button_text,
        description: handoffPayload.description,
        icon: handoffPayload.icon
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('Router handoff error:', error);
    
    // Log error metrics
    try {
      console.log('Router handoff failed', {
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } catch (logError) {
      console.warn('Failed to log error metrics:', logError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid handoff request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate handoff payload for different modules
function generateHandoffPayload(
  intent: string,
  extraction: any,
  originalText: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
  
  switch (intent) {
    case 'route_trip':
      return {
        module: 'optitrip',
        deep_link: `${baseUrl}/optitrip?prefilled=true`,
        button_text: '✈️ Open OptiTrip',
        description: 'Plan your travel with AI assistance',
        icon: '✈️',
        prefilled_data: {
          query: originalText,
          destinations: extraction.locations?.map((loc: any) => loc.text) || [],
          travel_dates: extraction.dates_times?.map((dt: any) => dt.text) || [],
          travelers: extraction.people?.map((p: any) => p.name || p.email) || [],
          preferences: extraction.constraints || [],
          topics: extraction.topics || [],
          budget_mentioned: extractBudgetInfo(originalText),
          trip_type: inferTripType(extraction.topics || [], originalText)
        },
        suggested_actions: [
          'search_flights',
          'find_hotels',
          'create_itinerary',
          'check_weather'
        ]
      };

    case 'route_shop':
      return {
        module: 'optishop',
        deep_link: `${baseUrl}/optishop?prefilled=true`,
        button_text: '🛒 Open OptiShop',
        description: 'Find and compare products with AI',
        icon: '🛒',
        prefilled_data: {
          query: originalText,
          products: extraction.topics?.filter((topic: string) => 
            !['buy', 'purchase', 'shopping', 'need'].includes(topic.toLowerCase())
          ) || [],
          budget: extractBudgetInfo(originalText),
          specifications: extraction.constraints || [],
          brand_preferences: extractBrandInfo(originalText),
          urgency: extraction.urgency || 'medium',
          category: inferProductCategory(extraction.topics || [], originalText)
        },
        suggested_actions: [
          'search_products',
          'compare_prices',
          'find_deals',
          'read_reviews'
        ]
      };

    case 'route_hire':
      return {
        module: 'optihire',
        deep_link: `${baseUrl}/optihire?prefilled=true`,
        button_text: '💼 Open OptiHire',
        description: 'Job search and hiring assistance',
        icon: '💼',
        prefilled_data: {
          query: originalText,
          job_title: inferJobTitle(extraction.topics || [], originalText),
          companies: extraction.people?.filter((p: any) => 
            p.role?.includes('company') || p.role?.includes('employer')
          ).map((p: any) => p.name) || [],
          skills: extraction.topics?.filter((topic: string) =>
            isSkillKeyword(topic)
          ) || [],
          locations: extraction.locations?.map((loc: any) => loc.text) || [],
          salary_range: extractSalaryInfo(originalText),
          experience_level: inferExperienceLevel(originalText),
          job_type: inferJobType(originalText)
        },
        suggested_actions: [
          'search_jobs',
          'optimize_resume',
          'practice_interview',
          'salary_research'
        ]
      };

    default:
      throw new Error(`Unsupported routing intent: ${intent}`);
  }
}

// Helper functions for data extraction

function extractBudgetInfo(text: string): string | null {
  const budgetPatterns = [
    /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
    /\d+(?:,\d{3})*\s*(?:dollars?|USD|€|euros?|£|pounds?)/gi,
    /budget\s*(?:of|is|around)?\s*\$?\d+/gi
  ];

  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return null;
}

function extractBrandInfo(text: string): string[] {
  // Common brand patterns - in real implementation, use a comprehensive brand database
  const brandKeywords = ['apple', 'samsung', 'nike', 'adidas', 'sony', 'lg', 'dell', 'hp', 'amazon'];
  const brands: string[] = [];
  
  brandKeywords.forEach(brand => {
    if (text.toLowerCase().includes(brand)) {
      brands.push(brand);
    }
  });

  return brands;
}

function extractSalaryInfo(text: string): string | null {
  const salaryPatterns = [
    /\$\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:per\s*year|annually|\/year|k|K)/g,
    /\d+(?:,\d{3})*\s*(?:k|K)\s*(?:per\s*year|annually|salary)?/g
  ];

  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return null;
}

function inferTripType(topics: string[], text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('business') || lowerText.includes('work') || lowerText.includes('conference')) {
    return 'business';
  } else if (lowerText.includes('vacation') || lowerText.includes('holiday') || lowerText.includes('leisure')) {
    return 'leisure';
  } else if (lowerText.includes('family') || lowerText.includes('kids')) {
    return 'family';
  } else if (topics.some(topic => ['adventure', 'hiking', 'skiing', 'beach'].includes(topic.toLowerCase()))) {
    return 'adventure';
  }
  
  return 'general';
}

function inferProductCategory(topics: string[], text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('laptop') || lowerText.includes('computer') || topics.some(t => ['tech', 'electronics'].includes(t.toLowerCase()))) {
    return 'electronics';
  } else if (lowerText.includes('clothes') || lowerText.includes('shirt') || topics.some(t => ['fashion', 'clothing'].includes(t.toLowerCase()))) {
    return 'clothing';
  } else if (lowerText.includes('book') || topics.some(t => t.toLowerCase() === 'books')) {
    return 'books';
  } else if (lowerText.includes('home') || lowerText.includes('furniture')) {
    return 'home';
  }
  
  return 'general';
}

function inferJobTitle(topics: string[], text: string): string {
  const jobTitles = [
    'developer', 'engineer', 'manager', 'designer', 'analyst', 'consultant',
    'director', 'specialist', 'coordinator', 'assistant', 'sales', 'marketing'
  ];

  for (const title of jobTitles) {
    if (text.toLowerCase().includes(title) || topics.some(t => t.toLowerCase().includes(title))) {
      return title;
    }
  }

  return '';
}

function inferExperienceLevel(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('entry') || lowerText.includes('junior') || lowerText.includes('new grad')) {
    return 'entry';
  } else if (lowerText.includes('senior') || lowerText.includes('lead') || lowerText.includes('principal')) {
    return 'senior';
  } else if (lowerText.includes('mid') || lowerText.includes('intermediate')) {
    return 'mid';
  }
  
  return 'mid'; // Default
}

function inferJobType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('remote') || lowerText.includes('work from home')) {
    return 'remote';
  } else if (lowerText.includes('full time') || lowerText.includes('full-time')) {
    return 'full_time';
  } else if (lowerText.includes('part time') || lowerText.includes('part-time')) {
    return 'part_time';
  } else if (lowerText.includes('contract') || lowerText.includes('freelance')) {
    return 'contract';
  }
  
  return 'full_time'; // Default
}

function isSkillKeyword(topic: string): boolean {
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
    'kubernetes', 'typescript', 'html', 'css', 'git', 'agile', 'scrum'
  ];
  
  return skillKeywords.includes(topic.toLowerCase());
}
