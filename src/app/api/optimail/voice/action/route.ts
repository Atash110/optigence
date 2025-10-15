import { NextRequest, NextResponse } from 'next/server';
import VoiceEnhancementService from '@/lib/voice';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const voiceService = new VoiceEnhancementService();
    const actionResult = await voiceService.voiceToAction(transcript);

    return NextResponse.json({
      ...actionResult,
      success: true
    });

  } catch (error) {
    console.error('Voice-to-Action error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process voice command',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
