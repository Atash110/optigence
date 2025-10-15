import { NextRequest, NextResponse } from 'next/server';

interface FreeBusyRequest {
  attendees: string[];
  timeMin: string;
  timeMax: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization' }, { status: 401 });
    }

    const accessToken = authHeader.split(' ')[1];
    const { attendees, timeMin, timeMax }: FreeBusyRequest = await request.json();

    if (!attendees || !timeMin || !timeMax) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // In a real implementation, this would call Google Calendar API
    // For demo purposes, we'll simulate free/busy data
    const freeBusyData = generateMockFreeBusyData(attendees, timeMin, timeMax);

    // In production, call Google Calendar API:
    /*
    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: attendees.map(email => ({ id: email }))
      })
    });

    if (!response.ok) {
      throw new Error('Google Calendar API call failed');
    }

    const data = await response.json();
    */

    return NextResponse.json({
      freeBusy: freeBusyData,
      timeZone: 'UTC'
    });

  } catch (error) {
    console.error('Free/busy query error:', error);
    return NextResponse.json(
      { error: 'Failed to query free/busy information' },
      { status: 500 }
    );
  }
}

function generateMockFreeBusyData(attendees: string[], timeMin: string, timeMax: string) {
  const freeBusy: { [email: string]: Array<{ start: string; end: string }> } = {};
  
  attendees.forEach(email => {
    freeBusy[email] = [];
    
    // Generate some mock busy periods
    const start = new Date(timeMin);
    const end = new Date(timeMax);
    
    // Add some typical busy periods (9-10 AM meetings, 2-3 PM meetings, etc.)
    for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
      // Skip weekends for business emails
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Random chance of having meetings
      if (Math.random() > 0.7) {
        const meetingStart = new Date(date);
        meetingStart.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0); // 9 AM to 5 PM
        
        const meetingEnd = new Date(meetingStart);
        meetingEnd.setMinutes(meetingEnd.getMinutes() + 30 + Math.floor(Math.random() * 60)); // 30-90 min meetings
        
        freeBusy[email].push({
          start: meetingStart.toISOString(),
          end: meetingEnd.toISOString()
        });
      }
      
      // Add lunch time busy period
      if (Math.random() > 0.5) {
        const lunchStart = new Date(date);
        lunchStart.setHours(12, 0, 0, 0);
        
        const lunchEnd = new Date(lunchStart);
        lunchEnd.setHours(13, 0, 0, 0);
        
        freeBusy[email].push({
          start: lunchStart.toISOString(),
          end: lunchEnd.toISOString()
        });
      }
    }
    
    // Sort busy periods by start time
    freeBusy[email].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  });
  
  return freeBusy;
}
