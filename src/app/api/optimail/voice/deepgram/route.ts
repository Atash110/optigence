import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const audioBuffer = await request.arrayBuffer();

    // Check if Deepgram API key is configured
    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // Deepgram API configuration
    const deepgramUrl = 'https://api.deepgram.com/v1/listen';
    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en-US',
      smart_format: 'true',
      alternatives: '3',
      confidence: 'true',
      punctuate: 'true',
      diarize: 'false',
      sentiment: 'true',
      emotion: 'true'
    });

    // Make request to Deepgram
    const response = await fetch(`${deepgramUrl}?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/wav',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Deepgram response to match our interface
    if (data.results?.channels?.[0]?.alternatives?.[0]) {
      const primary = data.results.channels[0].alternatives[0];
      
      return NextResponse.json({
        results: {
          channels: [{
            alternatives: data.results.channels[0].alternatives.map((alt: { transcript: string; confidence: number; words?: unknown[] }) => ({
              transcript: alt.transcript,
              confidence: alt.confidence,
              words: alt.words || []
            }))
          }]
        },
        metadata: {
          duration: data.metadata?.duration || 0,
          language: 'en-US',
          model: 'nova-2',
          provider: 'deepgram'
        },
        // Enhanced features from Deepgram
        sentiment: data.results.channels[0].alternatives[0].summaries?.[0]?.sentiment || 'neutral',
        emotion: data.results.channels[0].alternatives[0].summaries?.[0]?.emotion || 'neutral',
        confidence: primary.confidence
      });
    }

    return NextResponse.json(
      { error: 'No transcription results from Deepgram' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Deepgram API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Deepgram transcription failed',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown transcription error' },
      { status: 500 }
    );
  }
}
