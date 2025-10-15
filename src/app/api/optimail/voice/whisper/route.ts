import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const model = formData.get('model') as string || 'whisper-1';
    const language = formData.get('language') as string || 'en';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Convert File to Buffer for OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File-like object for OpenAI API
    const fileForOpenAI = new File([buffer], audioFile.name, {
      type: audioFile.type,
    });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fileForOpenAI,
      model: model,
      language: language,
      response_format: 'verbose_json',
      temperature: 0.2,
    });

    // Extract alternatives if available (Whisper doesn't provide alternatives directly)
    const alternatives: string[] = [];
    
    // Simulate alternatives by running transcription with different temperatures
    try {
      const altTranscription = await openai.audio.transcriptions.create({
        file: fileForOpenAI,
        model: model,
        language: language,
        response_format: 'verbose_json',
        temperature: 0.5,
      });
      
      if (altTranscription.text !== transcription.text) {
        alternatives.push(altTranscription.text);
      }
    } catch (error) {
      console.log('Alternative transcription failed:', error);
    }

    return NextResponse.json({
      text: transcription.text,
      language: transcription.language || language,
      duration: transcription.duration,
      confidence: 0.95, // Whisper doesn't provide confidence scores
      alternatives,
      segments: transcription.segments || [],
      provider: 'whisper'
    });

  } catch (error) {
    console.error('Whisper API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Whisper transcription failed',
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
