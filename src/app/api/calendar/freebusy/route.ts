import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const FreeBusySchema = z.object({
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  duration: z.number().min(15).max(480).default(60), // meeting duration in minutes
  timezone: z.string().default('UTC')
});

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check Google Calendar credentials
    const clientId = process.env.GCAL_CLIENT_ID;
    const clientSecret = process.env.GCAL_CLIENT_SECRET;
    const refreshToken = process.env.GCAL_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        { error: 'Google Calendar credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { windowStart, windowEnd, duration, timezone } = FreeBusySchema.parse(body);

    // Get fresh access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.json().catch(() => ({ error: 'Token refresh failed' }));
      console.error('Google token refresh error:', tokenError);
      
      return NextResponse.json(
        { error: 'Failed to refresh Google Calendar access token' },
        { status: 401 }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Query Google Calendar free/busy
    const freeBusyResponse = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin: windowStart,
        timeMax: windowEnd,
        timeZone: timezone,
        items: [{ id: 'primary' }] // Check primary calendar
      })
    });

    if (!freeBusyResponse.ok) {
      const freeBusyError = await freeBusyResponse.json().catch(() => ({ error: 'FreeBusy query failed' }));
      console.error('Google FreeBusy error:', freeBusyError);
      
      return NextResponse.json(
        { error: 'Failed to query calendar availability' },
        { status: freeBusyResponse.status }
      );
    }

    const freeBusyData = await freeBusyResponse.json();
    const busyTimes = freeBusyData.calendars?.primary?.busy || [];

    // Get user's preferred time windows from Supabase (TODO: implement)
    const userTimeWindows = await getUserTimeWindows();

    // Generate smart time slots
    const proposedSlots = generateSmartSlots(
      windowStart,
      windowEnd,
      duration,
      busyTimes,
      userTimeWindows,
      timezone
    );

    const requestDuration = Date.now() - startTime;

    // Log metrics
    try {
      console.log('Calendar free/busy completed', {
        duration_ms: requestDuration,
        busy_periods: busyTimes.length,
        proposed_slots: proposedSlots.length,
        success: true
      });
    } catch (logError) {
      console.warn('Failed to log calendar metrics:', logError);
    }

    return NextResponse.json({
      availability: {
        busy_times: busyTimes,
        user_preferences: userTimeWindows,
        proposed_slots: proposedSlots.slice(0, 3) // Return top 3 suggestions
      },
      metadata: {
        window_start: windowStart,
        window_end: windowEnd,
        duration_minutes: duration,
        timezone,
        generated_at: new Date().toISOString(),
        duration_ms: requestDuration
      }
    });

  } catch (error) {
    const requestDuration = Date.now() - startTime;
    
    console.error('Calendar free/busy error:', error);
    
    // Log error metrics
    try {
      console.log('Calendar free/busy failed', {
        duration_ms: requestDuration,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } catch (logError) {
      console.warn('Failed to log error metrics:', logError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's preferred time windows from Supabase
async function getUserTimeWindows() {
  // TODO: Implement Supabase query for user preferences
  // For now, return default business hours
  return {
    business_hours: {
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    preferred_slots: [
      { start: '09:00', end: '11:00', preference: 'high' },
      { start: '14:00', end: '16:00', preference: 'medium' }
    ],
    blocked_times: []
  };
}

// Generate smart meeting time suggestions
function generateSmartSlots(
  windowStart: string,
  windowEnd: string,
  duration: number,
  busyTimes: Array<{ start: string; end: string }>,
  userPreferences: any,
  timezone: string
): TimeSlot[] {
  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  const durationMs = duration * 60 * 1000;
  const slots: TimeSlot[] = [];

  // Convert busy times to Date objects
  const busyPeriods = busyTimes.map(period => ({
    start: new Date(period.start),
    end: new Date(period.end)
  }));

  // Generate potential slots every 30 minutes
  const current = new Date(start);
  while (current < end) {
    const slotEnd = new Date(current.getTime() + durationMs);
    
    if (slotEnd <= end) {
      // Check if slot conflicts with busy times
      const isAvailable = !busyPeriods.some(busy => 
        (current >= busy.start && current < busy.end) ||
        (slotEnd > busy.start && slotEnd <= busy.end) ||
        (current <= busy.start && slotEnd >= busy.end)
      );

      // Score slot based on user preferences
      const score = scoreTimeSlot(current, userPreferences);

      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable,
        reason: isAvailable ? `Score: ${score}` : 'Conflicts with existing appointment'
      });
    }

    // Move to next 30-minute slot
    current.setTime(current.getTime() + 30 * 60 * 1000);
  }

  // Sort by availability and preference score
  return slots
    .filter(slot => slot.available)
    .sort((a, b) => {
      const scoreA = parseScore(a.reason);
      const scoreB = parseScore(b.reason);
      return scoreB - scoreA;
    });
}

// Score time slots based on user preferences
function scoreTimeSlot(slotTime: Date, preferences: any): number {
  let score = 0;
  
  const hour = slotTime.getHours();
  const dayOfWeek = slotTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  // Business hours preference
  if (preferences.business_hours?.days?.includes(dayName)) {
    const startHour = parseInt(preferences.business_hours.start.split(':')[0]);
    const endHour = parseInt(preferences.business_hours.end.split(':')[0]);
    
    if (hour >= startHour && hour <= endHour) {
      score += 50;
    }
  }

  // Preferred time slots
  preferences.preferred_slots?.forEach((slot: any) => {
    const prefStart = parseInt(slot.start.split(':')[0]);
    const prefEnd = parseInt(slot.end.split(':')[0]);
    
    if (hour >= prefStart && hour <= prefEnd) {
      const multiplier = slot.preference === 'high' ? 30 : slot.preference === 'medium' ? 20 : 10;
      score += multiplier;
    }
  });

  // Avoid very early or very late hours
  if (hour < 8 || hour > 18) {
    score -= 20;
  }

  // Slightly prefer earlier in the day
  score += Math.max(0, 18 - hour);

  return score;
}

// Parse score from reason string
function parseScore(reason?: string): number {
  if (!reason) return 0;
  const match = reason.match(/Score: (\d+)/);
  return match ? parseInt(match[1]) : 0;
}
