import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';

interface DiagnosticResult {
  service: string;
  status: 'success' | 'error' | 'not_configured';
  latency?: number;
  details?: string;
  error?: string;
  timestamp: string;
}

interface HealthCheckResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  results: DiagnosticResult[];
  summary: {
    total: number;
    success: number;
    errors: number;
    not_configured: number;
  };
}

class APIDiagnostics {
  constructor(private baseUrl: string) {}

  private async testOpenAI(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          service: 'OpenAI GPT-4 Turbo',
          status: 'not_configured',
          details: 'OPENAI_API_KEY environment variable missing',
          timestamp: new Date().toISOString()
        };
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test connection - respond with "OK"' }],
        max_tokens: 10
      });

      const latency = Date.now() - start;
      const content = response.choices[0]?.message?.content;

      return {
        service: 'OpenAI GPT-4 Turbo',
        status: content ? 'success' : 'error',
        latency,
        details: `Model: ${response.model}, Usage: ${response.usage?.total_tokens} tokens`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'OpenAI GPT-4 Turbo',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testGemini(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return {
          service: 'Google Gemini 1.5 Flash',
          status: 'not_configured',
          details: 'GEMINI_API_KEY or GOOGLE_API_KEY environment variable missing',
          timestamp: new Date().toISOString()
        };
      }

      // Test Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test connection - respond with "OK"' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      const data = await response.json();
      const latency = Date.now() - start;

      if (!response.ok) {
        return {
          service: 'Google Gemini 1.5 Flash',
          status: 'error',
          latency,
          error: data.error?.message || 'API request failed',
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Google Gemini 1.5 Flash',
        status: 'success',
        latency,
        details: `Response received from gemini-1.5-flash-latest`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Google Gemini 1.5 Flash',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Network or parsing error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testCohere(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const apiKey = process.env.COHERE_API_KEY;
      if (!apiKey) {
        return {
          service: 'Cohere Classification',
          status: 'not_configured',
          details: 'COHERE_API_KEY environment variable missing',
          timestamp: new Date().toISOString()
        };
      }

      // Test Cohere Chat API (since Classify is discontinued)
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-light',
          message: 'Test connection - respond with "OK"',
          max_tokens: 10
        })
      });

      const data = await response.json();
      const latency = Date.now() - start;

      if (!response.ok) {
        return {
          service: 'Cohere Classification',
          status: 'error',
          latency,
          error: data.message || 'API request failed',
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Cohere Classification',
        status: 'success',
        latency,
        details: `Model: command-light, Response received`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Cohere Classification',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Network or parsing error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testSupabase(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        return {
          service: 'Supabase Database',
          status: 'not_configured',
          details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing',
          timestamp: new Date().toISOString()
        };
      }

      const supabase = createClient(url, key);
      
      // Test connection with waitlist_users table first (should always exist)
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('waitlist_users')
        .select('id')
        .limit(1);

      const latency = Date.now() - start;

      if (!waitlistError) {
        return {
          service: 'Supabase Database',
          status: 'success',
          latency,
          details: `Connection successful - waitlist table has ${waitlistData?.length || 0} entries`,
          timestamp: new Date().toISOString()
        };
      }

      // If waitlist fails, try users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (!userError) {
        return {
          service: 'Supabase Database',
          status: 'success',
          latency,
          details: `Connection successful - users table has ${userData?.length || 0} entries`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Supabase Database',
        status: 'error',
        latency,
        error: waitlistError.message || userError.message,
        details: 'Connection established but database tables may not be created yet',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Supabase Database',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testGoogleCalendar(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret || 
          clientId.includes('paste_your_actual') || 
          clientSecret.includes('paste_your_actual')) {
        return {
          service: 'Google Calendar API',
          status: 'not_configured',
          details: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET need to be configured with real values',
          timestamp: new Date().toISOString()
        };
      }

      // For now, just check if credentials are properly configured
      // Full OAuth flow test would require user authorization
      return {
        service: 'Google Calendar API',
        status: 'success',
        latency: Date.now() - start,
        details: 'OAuth credentials configured - requires user authorization for full testing',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Google Calendar API',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Configuration error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async logToSupabase(results: DiagnosticResult[]) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) return;

      const supabase = createClient(url, key);
      
      // Log each diagnostic result
      const logEntries = results.map(result => ({
        action: 'api_diagnostic',
        component: result.service,
        status: result.status,
        details: JSON.stringify({
          latency: result.latency,
          details: result.details,
          error: result.error
        }),
        created_at: new Date().toISOString()
      }));

      // Use upsert with error handling for missing table
      const { error } = await supabase
        .from('events_log')
        .insert(logEntries);
        
      if (error && !error.message.includes('relation "events_log" does not exist')) {
        console.warn('Supabase logging error:', error);
      }
    } catch (error) {
      // Silently fail logging - don't break diagnostics
      console.warn('Failed to log diagnostics to Supabase:', error);
    }
  }

  async runAllDiagnostics(): Promise<HealthCheckResponse> {
    console.log('🔍 Running OptiMail API Diagnostics...');
    
    const diagnosticPromises = [
      this.testOpenAI(),
      this.testGemini(),
      this.testCohere(),
      this.testSupabase(),
      this.testGoogleCalendar(),
      this.testAudioTranscription(),
      this.testIntentDetection(),
      this.testEntityExtraction(),
      this.testCalendarFreeBusy(),
      this.testLLMDraft(),
      this.testTemplateSystem()
    ];

    const results = await Promise.allSettled(diagnosticPromises);

    // Process results and convert PromiseSettledResult to DiagnosticResult
    const processedResults: DiagnosticResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Create error result for failed diagnostics
        const services = ['OpenAI', 'Gemini', 'Cohere', 'Supabase', 'Google Calendar'];
        return {
          service: services[index] || 'Unknown Service',
          status: 'error',
          error: result.reason?.message || 'Diagnostic test failed',
          timestamp: new Date().toISOString()
        } as DiagnosticResult;
      }
    });

    // Log to Supabase if available (but don't let it fail the whole response)
    try {
      await this.logToSupabase(processedResults);
    } catch (logError) {
      console.warn('Supabase logging failed, continuing with diagnostics:', logError);
    }

    const summary = {
      total: processedResults.length,
      success: processedResults.filter(r => r.status === 'success').length,
      errors: processedResults.filter(r => r.status === 'error').length,
      not_configured: processedResults.filter(r => r.status === 'not_configured').length
    };

    const overall: 'healthy' | 'degraded' | 'unhealthy' = 
      summary.errors === 0 && summary.not_configured === 0 ? 'healthy' :
      summary.success >= summary.total / 2 ? 'degraded' : 'unhealthy';

    return {
      overall,
      results: processedResults,
      summary
    };
  }

  // Test audio transcription endpoint
  private async testAudioTranscription(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          service: 'Audio Transcription',
          status: 'not_configured',
          details: 'OpenAI API key missing',
          timestamp: new Date().toISOString()
        };
      }

      // Test endpoint availability (without actual audio file)
      const testResponse = await fetch(`${this.baseUrl}/api/asr/transcribe`, {
        method: 'POST',
        body: new FormData() // Empty form data to test endpoint
      });

      const latency = Date.now() - start;
      
      // Expecting 400 for missing file, which indicates endpoint is working
      if (testResponse.status === 400) {
        return {
          service: 'Audio Transcription',
          status: 'success',
          latency,
          details: 'Endpoint configured correctly',
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Audio Transcription',
        status: 'error',
        latency,
        error: `Unexpected status: ${testResponse.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Audio Transcription',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test intent detection endpoint
  private async testIntentDetection(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'I need to schedule a meeting with John' })
      });

      const latency = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'Intent Detection',
          status: 'success',
          latency,
          details: `Detected intent: ${data.primary_intent} (${Math.round(data.confidence * 100)}% confidence)`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Intent Detection',
        status: 'error',
        latency,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Intent Detection',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test entity extraction endpoint
  private async testEntityExtraction(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: 'Can we schedule a meeting with Sarah next Tuesday at 2pm?' 
        })
      });

      const latency = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'Entity Extraction',
          status: 'success',
          latency,
          details: `Extracted ${data.people?.length || 0} people, ${data.dates_times?.length || 0} dates`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Entity Extraction',
        status: 'error',
        latency,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Entity Extraction',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test calendar free/busy endpoint
  private async testCalendarFreeBusy(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      const dayEnd = new Date(tomorrow);
      dayEnd.setHours(17, 0, 0, 0);

      const response = await fetch(`${this.baseUrl}/api/calendar/freebusy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          windowStart: tomorrow.toISOString(),
          windowEnd: dayEnd.toISOString()
        })
      });

      const latency = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'Calendar FreeBusy',
          status: 'success',
          latency,
          details: `Found ${data.availability?.proposed_slots?.length || 0} available slots`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Calendar FreeBusy',
        status: 'error',
        latency,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Calendar FreeBusy',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test LLM draft generation endpoint
  private async testLLMDraft(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/llm/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'reply',
          transcriptOrText: 'I need to reply about the meeting',
          extraction: {
            ask: 'Reply to meeting request',
            sentiment: 'neutral',
            topics: ['meeting']
          }
        })
      });

      const latency = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'LLM Draft Generation',
          status: 'success',
          latency,
          details: `Generated draft with ${data.primary_draft?.word_count || 0} words`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'LLM Draft Generation',
        status: 'error',
        latency,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'LLM Draft Generation',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test template system endpoint
  private async testTemplateSystem(): Promise<DiagnosticResult> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/templates/save?limit=1`);
      const latency = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'Template System',
          status: 'success',
          latency,
          details: `Template system ready, ${data.count || 0} templates available`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Template System',
        status: 'error',
        latency,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Template System',
        status: 'error',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// API endpoint handler
export async function GET(request: Request) {
  try {
    // Determine base URL dynamically (supports dev server non-3000 ports)
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const diagnostics = new APIDiagnostics(baseUrl);
    const healthCheck = await diagnostics.runAllDiagnostics();
    
    return NextResponse.json(healthCheck, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Diagnostics endpoint error:', error);
    return NextResponse.json({
      overall: 'unhealthy',
      error: error instanceof Error ? error.message : 'Diagnostics failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Allow manual trigger of diagnostics
  return GET(request);
}
