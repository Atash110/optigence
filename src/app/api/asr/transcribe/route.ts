import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema for form data
const TranscribeSchema = z.object({
  language: z.string().optional(),
  prompt: z.string().optional(), // Optional context for better accuracy
  temperature: z.number().min(0).max(1).optional(),
  response_format: z.enum(['json', 'text', 'srt', 'verbose_json', 'vtt']).optional(),
  model: z.enum(['whisper-1']).default('whisper-1')
});

// Supported audio formats and size limits
const SUPPORTED_FORMATS = ['flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'wav', 'webm'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for OpenAI Whisper

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          service: 'openai-whisper',
          available: false 
        },
        { status: 503 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const language = formData.get('language') as string || undefined;
    const prompt = formData.get('prompt') as string || undefined;
    const temperature = parseFloat(formData.get('temperature') as string || '0') || undefined;
    const responseFormat = formData.get('response_format') as string || 'verbose_json';
    const model = formData.get('model') as string || 'whisper-1';

    // Validate inputs
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file format
    const fileName = audioFile.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      return NextResponse.json(
        { 
          error: `Unsupported audio format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
          supported_formats: SUPPORTED_FORMATS
        },
        { status: 400 }
      );
    }

    // Validate optional parameters
    const validatedParams = TranscribeSchema.parse({
      language,
      prompt,
      temperature,
      response_format: responseFormat,
      model
    });

    // Prepare form data for OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', validatedParams.model);
    
    if (validatedParams.language) {
      openaiFormData.append('language', validatedParams.language);
    }
    
    if (validatedParams.prompt) {
      openaiFormData.append('prompt', validatedParams.prompt);
    }
    
    if (validatedParams.temperature !== undefined) {
      openaiFormData.append('temperature', validatedParams.temperature.toString());
    }
    
    if (validatedParams.response_format) {
      openaiFormData.append('response_format', validatedParams.response_format);
    }

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: openaiFormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI Whisper Error:', errorData);
      
      return NextResponse.json(
        { error: `Transcription failed: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const transcriptionResult = await response.json();
    const duration = Date.now() - startTime;

    // Process response based on format
    let processedResult;
    if (validatedParams.response_format === 'verbose_json') {
      processedResult = {
        text: transcriptionResult.text || '',
        language: transcriptionResult.language || validatedParams.language || 'unknown',
        duration: transcriptionResult.duration || null,
        segments: transcriptionResult.segments || [],
        words: transcriptionResult.words || [],
        confidence: calculateAverageConfidence(transcriptionResult.segments || []),
        processing_time_ms: duration,
        model_used: validatedParams.model
      };
    } else if (validatedParams.response_format === 'json') {
      processedResult = {
        text: transcriptionResult.text || transcriptionResult,
        language: validatedParams.language || 'unknown',
        processing_time_ms: duration,
        model_used: validatedParams.model
      };
    } else {
      // For text, srt, vtt formats, return as-is
      processedResult = transcriptionResult;
    }

    // Log metrics (without sensitive data)
    try {
      const fileInfo = {
        size_mb: Math.round((audioFile.size / 1024 / 1024) * 100) / 100,
        format: fileExtension,
        duration_estimate: estimateAudioDuration(audioFile.size, fileExtension),
        language: validatedParams.language || 'auto-detect'
      };

      console.log('Audio transcription completed', {
        file_info: fileInfo,
        response_format: validatedParams.response_format,
        processing_time_ms: duration,
        text_length: typeof processedResult === 'object' && processedResult.text 
          ? processedResult.text.length 
          : typeof processedResult === 'string' ? processedResult.length : 0,
        model: validatedParams.model,
        success: true
      });
    } catch (logError) {
      console.warn('Failed to log transcription metrics:', logError);
    }

    // Return appropriate content type based on response format
    if (validatedParams.response_format === 'text') {
      return new NextResponse(processedResult, {
        headers: { 'Content-Type': 'text/plain' }
      });
    } else if (validatedParams.response_format === 'srt') {
      return new NextResponse(processedResult, {
        headers: { 'Content-Type': 'application/x-subrip' }
      });
    } else if (validatedParams.response_format === 'vtt') {
      return new NextResponse(processedResult, {
        headers: { 'Content-Type': 'text/vtt' }
      });
    } else {
      return NextResponse.json(processedResult);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('Audio transcription error:', error);
    
    // Log error metrics
    try {
      console.log('Audio transcription failed', {
        processing_time_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } catch (logError) {
      console.warn('Failed to log transcription error metrics:', logError);
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

// GET: Return transcription service info and supported formats
export async function GET() {
  try {
    const serviceInfo = {
      service: 'OpenAI Whisper',
      available: !!process.env.OPENAI_API_KEY,
      supported_formats: SUPPORTED_FORMATS,
      max_file_size_mb: MAX_FILE_SIZE / 1024 / 1024,
      supported_languages: [
        'af', 'ar', 'hy', 'az', 'be', 'bs', 'bg', 'ca', 'zh', 'hr', 'cs', 'da', 'nl', 'en', 
        'et', 'fi', 'fr', 'gl', 'de', 'el', 'he', 'hi', 'hu', 'is', 'id', 'it', 'ja', 'kn', 
        'kk', 'ko', 'lv', 'lt', 'mk', 'ms', 'mr', 'mi', 'ne', 'no', 'fa', 'pl', 'pt', 'ro', 
        'ru', 'sr', 'sk', 'sl', 'es', 'sw', 'sv', 'tl', 'ta', 'th', 'tr', 'uk', 'ur', 'vi', 'cy'
      ],
      response_formats: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
      features: {
        automatic_language_detection: true,
        punctuation: true,
        timestamps: true,
        word_level_timestamps: true,
        speaker_identification: false,
        custom_vocabulary: false,
        real_time_streaming: false
      },
      usage_tips: [
        'Provide a prompt with context or proper nouns for better accuracy',
        'Use verbose_json format for detailed timing and confidence information',
        'Supported audio length: up to 25MB files',
        'Best quality with clean audio, minimal background noise'
      ]
    };

    return NextResponse.json(serviceInfo);

  } catch (error) {
    console.error('Error getting transcription service info:', error);
    return NextResponse.json(
      { error: 'Failed to get service information' },
      { status: 500 }
    );
  }
}

// Helper function to calculate average confidence from segments
function calculateAverageConfidence(segments: Array<{ avg_logprob?: number; no_speech_prob?: number }>): number {
  if (!segments || segments.length === 0) return 0;
  
  // Check if segments have confidence scores
  const segmentsWithConfidence = segments.filter(seg => 
    typeof seg.avg_logprob === 'number' || typeof seg.no_speech_prob === 'number'
  );
  
  if (segmentsWithConfidence.length === 0) return 0;
  
  // Convert log probabilities to confidence (rough approximation)
  const confidenceScores = segmentsWithConfidence.map(seg => {
    if (typeof seg.avg_logprob === 'number') {
      // Convert log probability to confidence (0-1)
      return Math.exp(seg.avg_logprob);
    } else if (typeof seg.no_speech_prob === 'number') {
      // Invert no_speech_prob to get speech confidence
      return 1 - seg.no_speech_prob;
    }
    return 0.5; // Default confidence
  });
  
  return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
}

// Helper function to estimate audio duration based on file size and format
function estimateAudioDuration(fileSizeBytes: number, format: string): string {
  // Rough estimates based on typical bitrates
  const bitratesKbps: { [key: string]: number } = {
    mp3: 128,
    wav: 1411, // CD quality
    flac: 800,  // Lossless compression
    m4a: 128,
    ogg: 128,
    webm: 128,
    mp4: 128,
    mpeg: 128,
    mpga: 128
  };
  
  const bitrate = bitratesKbps[format] || 128;
  const durationSeconds = (fileSizeBytes * 8) / (bitrate * 1000);
  
  if (durationSeconds < 60) {
    return `~${Math.round(durationSeconds)}s`;
  } else if (durationSeconds < 3600) {
    return `~${Math.round(durationSeconds / 60)}min`;
  } else {
    return `~${Math.round(durationSeconds / 3600)}h`;
  }
}
