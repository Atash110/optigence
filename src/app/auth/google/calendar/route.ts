import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Define scopes for calendar access
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
      state: 'calendar_auth'
    });

    // Check if this is a redirect request or API call
    const { searchParams } = new URL(req.url);
    const redirect = searchParams.get('redirect');

    if (redirect === 'true') {
      // Redirect directly to Google OAuth
      return NextResponse.redirect(authUrl);
    } else {
      // Return JSON with authorization URL
      return NextResponse.json({
        success: true,
        authUrl,
        instructions: [
          '1. Visit the authUrl to authorize OptiMail to access your Google Calendar',
          '2. After authorization, you will be redirected back with tokens',
          '3. Copy the refresh_token and add it to your .env.local file'
        ],
        scopes
      });
    }

  } catch (error) {
    console.error('Google Calendar auth initialization error:', error);
    return NextResponse.json({
      error: 'Failed to initialize Google Calendar authorization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
