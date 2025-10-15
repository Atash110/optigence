import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json({ 
        error: 'OAuth authorization failed', 
        details: error 
      }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ 
        error: 'Authorization code missing' 
      }, { status: 400 });
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getAccessToken(code);
      
      // Store tokens (in production, store in database per user)
      // For now, we'll return them for manual storage
      
      return NextResponse.json({
        success: true,
        message: 'Google Calendar authorization successful!',
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date
        },
        instructions: 'Copy the refresh_token and add it to your .env.local as GOOGLE_REFRESH_TOKEN'
      });

    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.json({
        error: 'Failed to exchange authorization code for tokens',
        details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({
      error: 'OAuth callback processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
