import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/optimail?calendar_error=' + encodeURIComponent(error), request.url));
    }

    if (!code) {
      return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
    }

    // Validate state parameter (in production, check against stored state)
    console.log('OAuth state parameter:', state);

    // In a real implementation, this would:
    // 1. Exchange the authorization code for access/refresh tokens
    // 2. Store tokens securely
    // 3. Redirect user back to the application

    // For demo purposes, simulate successful OAuth flow
    const demoTokens = {
      access_token: 'demo-access-token-' + Math.random().toString(36),
      refresh_token: 'demo-refresh-token-' + Math.random().toString(36),
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/calendar'
    };

    // In production, exchange code for real tokens:
    /*
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    */

    // Store tokens (in production, store securely in database)
    // For demo, we'll use a cookie or redirect with success flag

    // Redirect back to OptiMail with success indication
    const redirectUrl = new URL('/optimail', request.url);
    redirectUrl.searchParams.set('calendar_connected', 'true');
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set a temporary cookie to indicate successful connection
    response.cookies.set('google_calendar_token', demoTokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });

    return response;

  } catch (error) {
    console.error('Calendar callback error:', error);
    const errorUrl = new URL('/optimail', request.url);
    errorUrl.searchParams.set('calendar_error', 'connection_failed');
    return NextResponse.redirect(errorUrl);
  }
}

export async function POST(request: NextRequest) {
  // Handle token refresh or other POST operations
  try {
    const { action } = await request.json();
    
    if (action === 'refresh') {
      // Handle token refresh
      return NextResponse.json({
        access_token: 'demo-refreshed-token-' + Math.random().toString(36),
        expires_in: 3600,
        token_type: 'Bearer'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Calendar callback POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
