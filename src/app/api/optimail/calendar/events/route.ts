import { NextRequest, NextResponse } from 'next/server';

interface CreateEventRequest {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization' }, { status: 401 });
    }

    // const accessToken = authHeader.split(' ')[1]; // Will be used with real Google API
    const eventData: CreateEventRequest = await request.json();

    if (!eventData.summary || !eventData.start || !eventData.end) {
      return NextResponse.json({ error: 'Missing required event data' }, { status: 400 });
    }

    // In a real implementation, this would call Google Calendar API
    // For demo purposes, we'll simulate event creation
    const createdEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      summary: eventData.summary,
      description: eventData.description || '',
      start: eventData.start,
      end: eventData.end,
      attendees: eventData.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName || attendee.email.split('@')[0],
        responseStatus: 'needsAction' as const
      })),
      htmlLink: `https://calendar.google.com/calendar/event?eid=${btoa(eventData.summary)}`,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: 'confirmed',
      location: '',
      creator: {
        email: 'user@example.com', // Would be the authenticated user
        displayName: 'Current User'
      },
      organizer: {
        email: 'user@example.com',
        displayName: 'Current User'
      }
    };

    // In production, call Google Calendar API:
    /*
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees,
        sendNotifications: true
      })
    });

    if (!response.ok) {
      throw new Error('Google Calendar API call failed');
    }

    const createdEvent = await response.json();
    */

    return NextResponse.json(createdEvent);

  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
