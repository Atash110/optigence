/**
 * Calendar Events API Route for OptiMail
 */

import { NextApiRequest, NextApiResponse } from 'next';
import CalendarService from '../../../lib/calendar';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const calendarService = new CalendarService();

  switch (req.method) {
    case 'POST':
      return handleCreateEvent(req, res, calendarService);
    case 'GET':
      return handleGetEvents(req, res, calendarService);
    default:
      res.setHeader('Allow', ['POST', 'GET']);
      res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleCreateEvent(req: NextApiRequest, res: NextApiResponse, calendarService: CalendarService) {
  try {
    const { eventDetails, accessToken } = req.body;
    
    if (!eventDetails || !accessToken) {
      return res.status(400).json({ error: 'Event details and access token are required' });
    }

    // Set credentials
    calendarService.setCredentials({ access_token: accessToken });

    // Create the event
    const event = await calendarService.createEvent(eventDetails);
    
    res.status(201).json({ 
      success: true, 
      event: {
        id: event.id,
        title: event.summary,
        start: event.start,
        end: event.end,
        htmlLink: event.htmlLink,
        attendees: event.attendees
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleGetEvents(req: NextApiRequest, res: NextApiResponse, calendarService: CalendarService) {
  try {
    const { accessToken, maxResults = '10' } = req.query;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Set credentials
    calendarService.setCredentials({ access_token: accessToken });

    // Get upcoming events
    const events = await calendarService.getUpcomingEvents(parseInt(maxResults as string));
    
    res.status(200).json({ 
      success: true, 
      events: events.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start,
        end: event.end,
        description: event.description,
        location: event.location,
        attendees: event.attendees
      }))
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      error: 'Failed to get calendar events',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
