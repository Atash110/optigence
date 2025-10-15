import { z } from 'zod';

// Environment configuration schema with validation
const ConfigSchema = z.object({
  // OpenAI Configuration (Required)
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required for core functionality'),
  
  // Google APIs (Required for full functionality)
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  
  // Cohere (Required for intent classification)
  COHERE_API_KEY: z.string().optional(),
  
  // Google Calendar OAuth (Required for calendar features)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  
  // Supabase (Required for memory/profiles)
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Optional: Deepgram for streaming voice
  DEEPGRAM_API_KEY: z.string().optional(),
  
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

interface ConfigValidationResult {
  config: AppConfig;
  warnings: string[];
  errors: string[];
  isValid: boolean;
}

class OptiMailConfig {
  private static instance: OptiMailConfig;
  private _config: AppConfig | null = null;
  private _validationResult: ConfigValidationResult | null = null;

  private constructor() {}

  static getInstance(): OptiMailConfig {
    if (!OptiMailConfig.instance) {
      OptiMailConfig.instance = new OptiMailConfig();
    }
    return OptiMailConfig.instance;
  }

  get config(): AppConfig {
    if (!this._config) {
      this.validateConfig();
    }
    return this._config!;
  }

  get validationResult(): ConfigValidationResult {
    if (!this._validationResult) {
      this.validateConfig();
    }
    return this._validationResult!;
  }

  private validateConfig(): void {
    const env = process.env;
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Parse and validate basic schema
      const parsed = ConfigSchema.parse(env);
      
      // Advanced validation with business logic
      this.validateServiceConfig(parsed, warnings, errors);
      
      this._config = parsed;
      this._validationResult = {
        config: parsed,
        warnings,
        errors,
        isValid: errors.length === 0
      };

      // Log validation results in development
      if (env.NODE_ENV === 'development') {
        this.logValidationResults(warnings, errors);
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        errors.push(...zodErrors);
      } else {
        errors.push(`Configuration validation failed: ${error}`);
      }

      // Create minimal config for partial functionality
      this._config = this.createFallbackConfig(env);
      this._validationResult = {
        config: this._config,
        warnings,
        errors,
        isValid: false
      };
    }
  }

  private validateServiceConfig(config: AppConfig, warnings: string[], errors: string[]): void {
    // OpenAI validation
    if (!config.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required - OptiMail cannot function without it');
    }

    // Google services validation
    const hasGemini = config.GEMINI_API_KEY || config.GOOGLE_API_KEY;
    if (!hasGemini) {
      warnings.push('GEMINI_API_KEY/GOOGLE_API_KEY missing - Entity extraction will use slower OpenAI fallback');
    }

    // Cohere validation
    if (!config.COHERE_API_KEY) {
      warnings.push('COHERE_API_KEY missing - Intent detection will use basic pattern matching');
    }

    // Calendar validation
    const calendarKeys = [
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET, 
      config.GOOGLE_REDIRECT_URI,
      config.GOOGLE_REFRESH_TOKEN
    ];
    const missingCalendarKeys = calendarKeys.filter(key => !key).length;
    
    if (missingCalendarKeys > 0) {
      if (missingCalendarKeys === calendarKeys.length) {
        warnings.push('Google Calendar not configured - Calendar features will be disabled');
      } else {
        errors.push('Partial Google Calendar configuration - All OAuth fields required');
      }
    }

    // Supabase validation
    const supabaseKeys = [
      config.NEXT_PUBLIC_SUPABASE_URL,
      config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      config.SUPABASE_SERVICE_ROLE_KEY
    ];
    const missingSupabaseKeys = supabaseKeys.filter(key => !key).length;
    
    if (missingSupabaseKeys > 0) {
      if (missingSupabaseKeys === supabaseKeys.length) {
        warnings.push('Supabase not configured - User memory and templates will be disabled');
      } else {
        errors.push('Partial Supabase configuration - All keys required for database functionality');
      }
    }

    // Validate API key formats (basic checks)
    if (config.OPENAI_API_KEY && !config.OPENAI_API_KEY.startsWith('sk-')) {
      warnings.push('OPENAI_API_KEY format looks incorrect - should start with "sk-"');
    }

    if (config.COHERE_API_KEY && config.COHERE_API_KEY.length < 10) {
      warnings.push('COHERE_API_KEY format looks incorrect - check key length');
    }
  }

  private createFallbackConfig(env: NodeJS.ProcessEnv): AppConfig {
    return {
      OPENAI_API_KEY: env.OPENAI_API_KEY || '',
      GEMINI_API_KEY: env.GEMINI_API_KEY,
      GOOGLE_API_KEY: env.GOOGLE_API_KEY,
      COHERE_API_KEY: env.COHERE_API_KEY,
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: env.GOOGLE_REDIRECT_URI,
      GOOGLE_REFRESH_TOKEN: env.GOOGLE_REFRESH_TOKEN,
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      DEEPGRAM_API_KEY: env.DEEPGRAM_API_KEY,
      NODE_ENV: (env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      PORT: env.PORT || '3000'
    };
  }

  private logValidationResults(warnings: string[], errors: string[]): void {
    console.log('\n🔧 OptiMail Configuration Validation');
    console.log('=====================================');
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All services configured correctly');
      return;
    }

    if (errors.length > 0) {
      console.log('\n❌ CONFIGURATION ERRORS:');
      errors.forEach(error => console.log(`   ${error}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  CONFIGURATION WARNINGS:');
      warnings.forEach(warning => console.log(`   ${warning}`));
    }

    console.log('\n💡 Add missing environment variables to .env.local for full functionality\n');
  }

  // Service availability checks
  get services() {
    const config = this.config;
    return {
      openai: !!config.OPENAI_API_KEY,
      gemini: !!(config.GEMINI_API_KEY || config.GOOGLE_API_KEY),
      cohere: !!config.COHERE_API_KEY,
      calendar: !!(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && 
                   config.GOOGLE_REDIRECT_URI && config.GOOGLE_REFRESH_TOKEN),
      supabase: !!(config.NEXT_PUBLIC_SUPABASE_URL && config.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
                   config.SUPABASE_SERVICE_ROLE_KEY),
      deepgram: !!config.DEEPGRAM_API_KEY
    };
  }

  // Get masked config for client-side display
  getMaskedConfig() {
    const config = this.config;
    const mask = (value?: string) => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : 'Not configured';
    
    return {
      openai: mask(config.OPENAI_API_KEY),
      gemini: mask(config.GEMINI_API_KEY || config.GOOGLE_API_KEY),
      cohere: mask(config.COHERE_API_KEY),
      calendar: config.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured',
      supabase: config.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured',
      deepgram: mask(config.DEEPGRAM_API_KEY)
    };
  }
}

// Export singleton instance
export const config = OptiMailConfig.getInstance();
export default config;
