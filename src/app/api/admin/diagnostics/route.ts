import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';

interface APITestResult {
  service: string;
  status: 'success' | 'error' | 'missing_config' | 'partial';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

interface DiagnosticReport {
  overall_status: 'healthy' | 'partial' | 'critical';
  timestamp: string;
  results: APITestResult[];
  missing_env_vars: string[];
  recommendations: string[];
}

// Environment variable requirements
const REQUIRED_ENV_VARS = {
  openai: ['OPENAI_API_KEY'],
  cohere: ['COHERE_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], // Either one
  calendar: ['GCAL_CLIENT_ID', 'GCAL_CLIENT_SECRET'],
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  deepgram: ['DEEPGRAM_API_KEY'] // Optional
};

class APITester {
  private results: APITestResult[] = [];

  private async testOpenAI(): Promise<APITestResult> {
    const startTime = Date.now();
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          service: 'OpenAI GPT-4 Turbo',
          status: 'missing_config',
          error: 'OPENAI_API_KEY not configured',
          timestamp: new Date().toISOString()
        };
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: 'Test connection. Respond with just "OK".' }],
        max_tokens: 5,
        temperature: 0
      });

      const latency = Date.now() - startTime;
      
      return {
        service: 'OpenAI GPT-4 Turbo',
        status: 'success',
        latency,
        details: {
          model: completion.model,
          response: completion.choices[0]?.message?.content,
          usage: completion.usage
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'OpenAI GPT-4 Turbo',
        status: 'error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testCohere(): Promise<APITestResult> {
    const startTime = Date.now();
    try {
      if (!process.env.COHERE_API_KEY) {
        return {
          service: 'Cohere Classification',
          status: 'missing_config',
          error: 'COHERE_API_KEY not configured',
          timestamp: new Date().toISOString()
        };
      }

      const response = await fetch('https://api.cohere.ai/v1/classify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'embed-english-v3.0',
          inputs: ['Help me write an email'],
          examples: [
            { text: 'write email', label: 'compose' },
            { text: 'reply to email', label: 'reply' }
          ]
        })
      });

      const data = await response.json();
      const latency = Date.now() - startTime;

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
        details: {
          classifications: data.classifications,
          model: 'embed-english-v3.0'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Cohere Classification',
        status: 'error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testGemini(): Promise<APITestResult> {
    const startTime = Date.now();
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return {
          service: 'Google Gemini 1.5 Flash',
          status: 'missing_config',
          error: 'GEMINI_API_KEY or GOOGLE_API_KEY not configured',
          timestamp: new Date().toISOString()
        };
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Extract entities from: "Meeting with John at 3pm tomorrow". Respond with JSON only.' }]
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 100
          }
        })
      });

      const data = await response.json();
      const latency = Date.now() - startTime;

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
        details: {
          response: data.candidates?.[0]?.content?.parts?.[0]?.text,
          model: 'gemini-1.5-flash-latest'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Google Gemini 1.5 Flash',
        status: 'error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testSupabase(): Promise<APITestResult> {
    const startTime = Date.now();
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return {
          service: 'Supabase Database',
          status: 'missing_config',
          error: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not configured',
          timestamp: new Date().toISOString()
        };
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Test connection with a simple query
      const { error } = await supabase
        .from('user_profile')
        .select('count(*)')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        return {
          service: 'Supabase Database',
          status: 'error',
          latency,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }

      return {
        service: 'Supabase Database',
        status: 'success',
        latency,
        details: {
          connection: 'success',
          table_access: 'user_profile accessible'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Supabase Database',
        status: 'error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testGoogleCalendar(): Promise<APITestResult> {
    const startTime = Date.now();
    try {
      if (!process.env.GCAL_CLIENT_ID || !process.env.GCAL_CLIENT_SECRET) {
        return {
          service: 'Google Calendar',
          status: 'missing_config',
          error: 'GCAL_CLIENT_ID or GCAL_CLIENT_SECRET not configured',
          timestamp: new Date().toISOString()
        };
      }

      // For now, just check if the OAuth config is present
      // In a real implementation, we'd test with a service account or stored refresh token
      return {
        service: 'Google Calendar',
        status: 'partial',
        latency: Date.now() - startTime,
        error: 'OAuth credentials present but no active token for testing',
        details: {
          client_id: process.env.GCAL_CLIENT_ID ? 'configured' : 'missing',
          client_secret: process.env.GCAL_CLIENT_SECRET ? 'configured' : 'missing',
          note: 'Requires OAuth flow completion for full testing'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Google Calendar',
        status: 'error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testDeepgram(): Promise<APITestResult> {
    const startTime = Date.now();
    try {
      if (!process.env.DEEPGRAM_API_KEY) {
        return {
          service: 'Deepgram Voice (Optional)',
          status: 'missing_config',
          error: 'DEEPGRAM_API_KEY not configured - using browser Speech Recognition fallback',
          timestamp: new Date().toISOString()
        };
      }

      // Test Deepgram connection with a minimal request
      const response = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        },
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          service: 'Deepgram Voice (Optional)',
          status: 'error',
          latency,
          error: `API request failed: ${response.status} - ${errorText}`,
          timestamp: new Date().toISOString()
        };
      }

      const data = await response.json();
      
      return {
        service: 'Deepgram Voice (Optional)',
        status: 'success',
        latency,
        details: {
          projects_count: data.projects?.length || 0,
          connection: 'verified'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Deepgram Voice (Optional)',
        status: 'error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async runAllTests(): Promise<DiagnosticReport> {
    console.log('🔍 Starting OptiMail API diagnostics...');

    // Run all tests in parallel for speed
    const testPromises = [
      this.testOpenAI(),
      this.testCohere(),
      this.testGemini(),
      this.testSupabase(),
      this.testGoogleCalendar(),
      this.testDeepgram()
    ];

    const results = await Promise.all(testPromises);
    
    // Check for missing environment variables
    const missingEnvVars: string[] = [];
    Object.entries(REQUIRED_ENV_VARS).forEach(([service, vars]) => {
      vars.forEach(varName => {
        if (!process.env[varName] && !vars.some(alt => alt !== varName && process.env[alt])) {
          missingEnvVars.push(`${varName} (${service})`);
        }
      });
    });

    // Determine overall status
    const criticalServices = ['OpenAI GPT-4 Turbo', 'Supabase Database'];
    const criticalFailures = results.filter(r => 
      criticalServices.includes(r.service) && r.status === 'error'
    );
    const anyFailures = results.filter(r => r.status === 'error');

    let overallStatus: 'healthy' | 'partial' | 'critical';
    if (criticalFailures.length > 0) {
      overallStatus = 'critical';
    } else if (anyFailures.length > 0 || missingEnvVars.length > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'healthy';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (missingEnvVars.length > 0) {
      recommendations.push(`Configure missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    if (results.find(r => r.service.includes('Cohere') && r.status !== 'success')) {
      recommendations.push('Set up Cohere API for intent classification to enable smart suggestions');
    }
    if (results.find(r => r.service.includes('Gemini') && r.status !== 'success')) {
      recommendations.push('Configure Google Gemini 1.5 Flash for fast entity extraction');
    }
    if (results.find(r => r.service.includes('Calendar') && r.status !== 'success')) {
      recommendations.push('Complete Google Calendar OAuth setup for meeting scheduling');
    }

    return {
      overall_status: overallStatus,
      timestamp: new Date().toISOString(),
      results,
      missing_env_vars: missingEnvVars,
      recommendations
    };
  }
}

export async function GET() {
  try {
    const tester = new APITester();
    const report = await tester.runAllTests();

    // Log to Supabase if available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        await supabase.from('events_log').insert({
          event_type: 'api_diagnostics',
          user_id: 'system',
          metadata: {
            overall_status: report.overall_status,
            services_tested: report.results.length,
            failures: report.results.filter(r => r.status === 'error').length,
            missing_config: report.results.filter(r => r.status === 'missing_config').length
          },
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to log diagnostics to Supabase:', error);
      }
    }

    return NextResponse.json(report, { 
      status: report.overall_status === 'critical' ? 503 : 200 
    });
  } catch (error) {
    console.error('Diagnostics test failed:', error);
    return NextResponse.json(
      { error: 'Diagnostics system failure', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
