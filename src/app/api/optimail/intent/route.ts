import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent } from '@/lib/intent';

interface IntentRequest {
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: IntentRequest = await request.json();
    const { text } = body;
    
    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Use the existing intent classification service
    const result = await classifyIntent(text);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Intent API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to classify intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}