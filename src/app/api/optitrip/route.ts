import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_CONFIGS } from '@/lib/openai';

interface OptiTripRequest {
  action: 'plan' | 'recommend' | 'budget' | 'itinerary' | 'local' | 'social';
  destination?: string;
  dates?: {
    start: string;
    end: string;
  };
  budget?: {
    total: number;
    currency: string;
  };
  travelers?: {
    adults: number;
    children: number;
  };
  preferences?: {
    accommodation?: string[];
    activities?: string[];
    dining?: string[];
    transportation?: string[];
  };
  currentLocation?: string;
  instructions?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      action, 
      destination, 
      dates, 
      budget, 
      travelers, 
      preferences, 
      currentLocation, 
      instructions 
    }: OptiTripRequest = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const config = AI_CONFIGS.optitrip;
    
    // Build specific prompt based on action
    let prompt = '';
    
    switch (action) {
      case 'plan':
        prompt = `Help me plan a trip with these details:
        
        Destination: ${destination || 'Destination not specified'}
        ${dates ? `Travel Dates: ${dates.start} to ${dates.end}` : 'Dates flexible'}
        ${budget ? `Budget: ${budget.total} ${budget.currency}` : 'Budget not specified'}
        ${travelers ? `Travelers: ${travelers.adults} adults, ${travelers.children} children` : 'Group size not specified'}
        ${currentLocation ? `Departing from: ${currentLocation}` : ''}
        
        Preferences:
        ${preferences?.accommodation ? `Accommodation: ${preferences.accommodation.join(', ')}` : ''}
        ${preferences?.activities ? `Activities: ${preferences.activities.join(', ')}` : ''}
        ${preferences?.dining ? `Dining: ${preferences.dining.join(', ')}` : ''}
        ${preferences?.transportation ? `Transportation: ${preferences.transportation.join(', ')}` : ''}
        
        ${instructions ? `Special requirements: ${instructions}` : ''}
        
        Please provide a comprehensive travel plan including:
        1. Daily itinerary suggestions
        2. Accommodation recommendations
        3. Transportation options
        4. Must-see attractions
        5. Local dining suggestions
        6. Budget breakdown
        7. Travel tips and considerations`;
        break;
        
      case 'recommend':
        prompt = `Recommend destinations based on my preferences:
        
        ${currentLocation ? `Traveling from: ${currentLocation}` : ''}
        ${budget ? `Budget: ${budget.total} ${budget.currency}` : ''}
        ${dates ? `Travel period: ${dates.start} to ${dates.end}` : ''}
        ${travelers ? `Group: ${travelers.adults} adults, ${travelers.children} children` : ''}
        
        Interests:
        ${preferences?.activities ? `Activities: ${preferences.activities.join(', ')}` : ''}
        ${preferences?.accommodation ? `Accommodation style: ${preferences.accommodation.join(', ')}` : ''}
        ${preferences?.dining ? `Food preferences: ${preferences.dining.join(', ')}` : ''}
        
        ${instructions ? `Additional preferences: ${instructions}` : ''}
        
        Please suggest 3-5 destinations with:
        1. Why each destination fits my preferences
        2. Best time to visit
        3. Estimated costs
        4. Unique experiences available
        5. Practical travel information`;
        break;
        
      case 'budget':
        prompt = `Help me plan the budget for this trip:
        
        Destination: ${destination || 'Destination not specified'}
        ${dates ? `Duration: ${dates.start} to ${dates.end}` : 'Duration not specified'}
        ${travelers ? `Travelers: ${travelers.adults} adults, ${travelers.children} children` : ''}
        ${budget ? `Total budget: ${budget.total} ${budget.currency}` : 'Budget needs to be determined'}
        
        ${instructions ? `Budget considerations: ${instructions}` : ''}
        
        Please provide:
        1. Detailed budget breakdown by category
        2. Cost-saving tips
        3. Must-budget items vs. optional expenses
        4. Emergency fund recommendations
        5. Payment methods and currency tips
        6. Ways to track expenses during the trip`;
        break;
        
      case 'itinerary':
        prompt = `Create a detailed itinerary for my trip:
        
        Destination: ${destination || 'Destination not specified'}
        ${dates ? `Dates: ${dates.start} to ${dates.end}` : 'Dates not specified'}
        ${travelers ? `Group size: ${travelers.adults} adults, ${travelers.children} children` : ''}
        
        Interests:
        ${preferences?.activities ? `Activities: ${preferences.activities.join(', ')}` : ''}
        
        ${instructions ? `Specific requests: ${instructions}` : ''}
        
        Please create a day-by-day itinerary including:
        1. Morning, afternoon, and evening activities
        2. Restaurant recommendations for each meal
        3. Transportation between activities
        4. Estimated time and costs
        5. Alternative options in case of weather/closures
        6. Rest periods and flexibility
        7. Photo opportunities and must-see spots`;
        break;
        
      case 'local':
        prompt = `Provide local insights and tips for:
        
        Destination: ${destination || 'Destination not specified'}
        ${currentLocation ? `I'm traveling from: ${currentLocation}` : ''}
        
        ${instructions ? `Specific questions: ${instructions}` : ''}
        
        Please share:
        1. Local customs and etiquette
        2. Hidden gems and local favorites
        3. Cultural experiences and events
        4. Local food specialties to try
        5. Safety tips and common scams to avoid
        6. Language basics and useful phrases
        7. Tipping practices and local norms
        8. Best local transportation options
        9. Shopping recommendations
        10. Emergency contacts and important numbers`;
        break;
        
      case 'social':
        prompt = `Help me connect with other travelers and locals:
        
        Destination: ${destination || 'Destination not specified'}
        ${dates ? `Travel dates: ${dates.start} to ${dates.end}` : ''}
        
        ${instructions ? `Social preferences: ${instructions}` : ''}
        
        Please suggest:
        1. Ways to meet fellow travelers
        2. Local community events and gatherings
        3. Group tour options
        4. Language exchange opportunities
        5. Social apps and platforms for travelers
        6. Safe meetup locations and activities
        7. Cultural exchange experiences
        8. Volunteer opportunities
        9. Coworking spaces for digital nomads
        10. Local hobby groups and clubs`;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      action,
      result: responseMessage,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('OptiTrip API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
