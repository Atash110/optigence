import { google } from 'googleapis';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  description?: string;
  location?: string;
}

interface AvailabilitySlot {
  start: Date;
  end: Date;
  type: 'free' | 'busy' | 'tentative';
}

interface MeetingRequest {
  attendees: string[];
  duration: number; // in minutes
  title: string;
  description?: string;
  preferredTimes?: Date[];
  timeZone?: string;
}

class SmartCalendarIntegration {
  private calendar: ReturnType<typeof google.calendar> | null = null;
  private auth: InstanceType<typeof google.auth.GoogleAuth> | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize Google Calendar API
      const credentials = process.env.GOOGLE_CALENDAR_CREDENTIALS;
      if (!credentials) {
        throw new Error('Google Calendar credentials not found');
      }

      const parsedCredentials = JSON.parse(credentials);
      this.auth = new google.auth.GoogleAuth({
        credentials: parsedCredentials,
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events'
        ],
      });

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      this.initialized = true;
      console.log('Smart Calendar Integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize calendar:', error);
      throw error;
    }
  }

  /**
   * Get user's availability for the next 7 days
   */
  async getAvailability(
    timeMin?: Date,
    timeMax?: Date,
    timeZone = 'UTC'
  ): Promise<AvailabilitySlot[]> {
    await this.initialize();

    const startTime = timeMin || new Date();
    const endTime = timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          timeZone,
          items: [{ id: 'primary' }],
        },
      });

      const busyTimes = response.data.calendars?.primary?.busy || [];
      const availability: AvailabilitySlot[] = [];

      // Convert busy times to availability slots
      let currentTime = new Date(startTime);
      
      for (const busySlot of busyTimes) {
        if (busySlot.start && busySlot.end) {
          const busyStart = new Date(busySlot.start);
          const busyEnd = new Date(busySlot.end);

          // Add free time before busy slot
          if (currentTime < busyStart) {
            availability.push({
              start: new Date(currentTime),
              end: new Date(busyStart),
              type: 'free'
            });
          }

          // Add busy slot
          availability.push({
            start: busyStart,
            end: busyEnd,
            type: 'busy'
          });

          currentTime = busyEnd;
        }
      }

      // Add remaining free time
      if (currentTime < endTime) {
        availability.push({
          start: new Date(currentTime),
          end: new Date(endTime),
          type: 'free'
        });
      }

      return availability;
    } catch (error) {
      console.error('Failed to get availability:', error);
      return [];
    }
  }

  /**
   * Find optimal meeting times based on attendee availability
   */
  async findOptimalMeetingTimes(
    request: MeetingRequest
  ): Promise<Array<{
    start: Date;
    end: Date;
    score: number; // 0-1, higher is better
    conflicts: string[];
  }>> {
    await this.initialize();

    try {
      const timeZone = request.timeZone || 'UTC';
      const duration = request.duration;
      const startTime = new Date();
      const endTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Next 2 weeks

      // Get availability for all attendees
      const attendeeAvailability = await Promise.all(
        request.attendees.map(async (email) => {
          try {
            const response = await this.calendar.freebusy.query({
              requestBody: {
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                timeZone,
                items: [{ id: email }],
              },
            });
            return {
              email,
              busy: response.data.calendars?.[email]?.busy || []
            };
          } catch {
            return { email, busy: [] };
          }
        })
      );

      // Find free slots that work for everyone
      const optimalTimes = [];
      const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM

      for (let day = 0; day < 14; day++) {
        const currentDate = new Date(startTime);
        currentDate.setDate(currentDate.getDate() + day);
        currentDate.setHours(workingHours.start, 0, 0, 0);

        while (currentDate.getHours() < workingHours.end) {
          const slotStart = new Date(currentDate);
          const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

          if (slotEnd.getHours() >= workingHours.end) {
            break;
          }

          // Check conflicts for this time slot
          const conflicts = [];
          let totalConflicts = 0;

          for (const attendee of attendeeAvailability) {
            for (const busySlot of attendee.busy) {
              if (busySlot.start && busySlot.end) {
                const busyStart = new Date(busySlot.start);
                const busyEnd = new Date(busySlot.end);

                if (slotStart < busyEnd && slotEnd > busyStart) {
                  conflicts.push(attendee.email);
                  totalConflicts++;
                  break;
                }
              }
            }
          }

          // Calculate score (1 = no conflicts, 0 = all attendees busy)
          const score = 1 - (totalConflicts / request.attendees.length);

          if (score > 0) { // At least someone is free
            optimalTimes.push({
              start: new Date(slotStart),
              end: new Date(slotEnd),
              score,
              conflicts
            });
          }

          // Move to next 30-minute slot
          currentDate.setMinutes(currentDate.getMinutes() + 30);
        }
      }

      // Sort by score (best times first)
      return optimalTimes
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Return top 10 options

    } catch (error) {
      console.error('Failed to find optimal meeting times:', error);
      return [];
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    await this.initialize();

    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.summary,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          description: event.description,
          location: event.location,
        },
      });

      return response.data as CalendarEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      return null;
    }
  }

  /**
   * Get upcoming events for context
   */
  async getUpcomingEvents(limit = 10): Promise<CalendarEvent[]> {
    await this.initialize();

    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: limit,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Failed to get upcoming events:', error);
      return [];
    }
  }

  /**
   * Analyze email content for potential meeting requests
   */
  detectMeetingRequests(emailContent: string): {
    hasMeetingRequest: boolean;
    suggestedDuration: number;
    suggestedTitle: string;
    urgency: 'low' | 'medium' | 'high';
    detectedAttendees: string[];
  } {
    const meetingKeywords = [
      'meeting', 'call', 'discussion', 'sync', 'catch up',
      'conference', 'presentation', 'demo', 'review'
    ];
    
    const urgentKeywords = [
      'urgent', 'asap', 'immediately', 'critical', 'important'
    ];

    const emailLower = emailContent.toLowerCase();
    
    // Detect meeting request
    const hasMeetingRequest = meetingKeywords.some(keyword => 
      emailLower.includes(keyword)
    );

    // Detect urgency
    const urgency = urgentKeywords.some(keyword => 
      emailLower.includes(keyword)
    ) ? 'high' : 'medium';

    // Extract duration hints
    const durationPatterns = [
      /(\d+)\s*(?:hour|hr)s?/gi,
      /(\d+)\s*(?:minute|min)s?/gi,
      /half\s*hour/gi,
      /quick\s*(?:chat|call)/gi
    ];

    let suggestedDuration = 30; // Default 30 minutes
    
    for (const pattern of durationPatterns) {
      const match = emailContent.match(pattern);
      if (match) {
        if (match[0].includes('hour') || match[0].includes('hr')) {
          suggestedDuration = parseInt(match[1]) * 60;
        } else if (match[0].includes('minute') || match[0].includes('min')) {
          suggestedDuration = parseInt(match[1]);
        } else if (match[0].includes('half hour')) {
          suggestedDuration = 30;
        } else if (match[0].includes('quick')) {
          suggestedDuration = 15;
        }
        break;
      }
    }

    // Extract email addresses for attendees
    const emailPattern = /[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/g;
    const detectedAttendees = emailContent.match(emailPattern) || [];

    // Generate suggested title
    const titleKeywords = emailContent
      .split(/[.!?]/)
      .find(sentence => 
        meetingKeywords.some(keyword => 
          sentence.toLowerCase().includes(keyword)
        )
      ) || 'Meeting';

    const suggestedTitle = titleKeywords.slice(0, 50).trim() + 
      (titleKeywords.length > 50 ? '...' : '');

    return {
      hasMeetingRequest,
      suggestedDuration,
      suggestedTitle,
      urgency: urgency as 'low' | 'medium' | 'high',
      detectedAttendees
    };
  }
}

const smartCalendar = new SmartCalendarIntegration();
export default smartCalendar;
export type { CalendarEvent, AvailabilitySlot, MeetingRequest };
