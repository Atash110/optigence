import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { email, referralSource, subscribed = false, token } = await request.json();

    // Validate reCAPTCHA token
    if (!token) {
      return NextResponse.json(
        { error: 'RECAPTCHA_TOKEN_REQUIRED' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA with Google (works with both regular v3 and enterprise.js)
    const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const captchaData = await captchaRes.json();
    
    // Log reCAPTCHA response for debugging
    console.log('reCAPTCHA Response:', captchaData);

    if (!captchaData.success) {
      console.log('reCAPTCHA Error Codes:', captchaData['error-codes']);
      
      // In development, be more lenient with hostname mismatches
      const isDevelopment = process.env.NODE_ENV === 'development';
      const hasHostnameError = captchaData['error-codes']?.includes('hostname-mismatch');
      const hasInvalidDomainError = captchaData['error-codes']?.includes('invalid-input-response');
      
      if (isDevelopment && (hasHostnameError || hasInvalidDomainError)) {
        console.log('Development mode: Allowing domain mismatch for localhost');
      } else {
        return NextResponse.json(
          { 
            error: 'RECAPTCHA_VERIFICATION_FAILED',
            details: captchaData['error-codes'] 
          },
          { status: 400 }
        );
      }
    }

    // For reCAPTCHA v3, check score (0.0 = likely bot, 1.0 = likely human)
    // Use lower threshold in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const scoreThreshold = isDevelopment ? 0.1 : 0.5;
    
    if (captchaData.score < scoreThreshold) {
      console.log('reCAPTCHA Score too low:', captchaData.score, 'threshold:', scoreThreshold);
      return NextResponse.json(
        { 
          error: 'RECAPTCHA_SCORE_TOO_LOW',
          score: captchaData.score 
        },
        { status: 400 }
      );
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'EMAIL_REQUIRED' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'SERVER_CONFIGURATION_ERROR' },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('waitlist_users')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'EMAIL_ALREADY_EXISTS' },
        { status: 409 }
      );
    }

    // Insert new waitlist user
    const { data, error } = await supabase
      .from('waitlist_users')
      .insert([
        {
          email: email.trim().toLowerCase(),
          referral_source: referralSource || 'website',
          subscribed: subscribed,
          metadata: {
            user_agent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            timestamp: new Date().toISOString()
          }
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting waitlist user:', error);
      return NextResponse.json(
        { error: 'UNABLE_TO_JOIN_WAITLIST' },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully joined the waitlist!',
        data: {
          email: data.email,
          created_at: data.created_at
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// Handle GET requests (optional - for testing)
export async function GET() {
  return NextResponse.json(
    { message: 'Waitlist API is running' },
    { status: 200 }
  );
}
