/**
 * Google Calendar API Routes for OptiMail
 */

import { NextApiRequest, NextApiResponse } from 'next';
import CalendarService from '../../../lib/calendar';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const calendarService = new CalendarService();

  switch (req.method) {
    case 'GET':
      return handleGetAuth(req, res, calendarService);
    case 'POST':
      return handleCallback(req, res, calendarService);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetAuth(req: NextApiRequest, res: NextApiResponse, calendarService: CalendarService) {
  try {
    const authUrl = calendarService.getAuthUrl('calendar_integration');
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Calendar auth error:', error);
    res.status(500).json({ 
      error: 'Failed to generate auth URL',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleCallback(req: NextApiRequest, res: NextApiResponse, calendarService: CalendarService) {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokens = await calendarService.getAccessToken(code);
    
    // Store tokens securely (you might want to encrypt and store in database)
    res.status(200).json({ 
      success: true, 
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('Calendar callback error:', error);
    res.status(500).json({ 
      error: 'Failed to exchange code for tokens',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
