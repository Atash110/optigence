/**
 * OptiMail Calendar Integration
 * Google OAuth, free/busy analysis, and smart scheduling
 */

export interface TimeWindow {
  start: string; // ISO string
  end: string; // ISO string
  timezone: string;
  type: 'work' | 'personal' | 'available' | 'busy';
}

export interface SmartSlot {
  id: string;
  start: string;
  end: string;
  duration: number; // minutes
  confidence: number; // 0-1
  reasoning: string;
  attendees: string[];
  conflicts?: string[];
}

export interface CalendarEvent {
  id: string;
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
    responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative';
  }>;
}

export interface UserTimePreferences {
  timezone: string;
  workingHours: {
    start: string; // HH:mm format
    end: string;
  };
  workingDays: number[]; // 0-6, Sunday = 0
  preferredMeetingDuration: number; // minutes
  bufferTime: number; // minutes between meetings
  unavailableTimes: TimeWindow[];
}

class CalendarService {
  private accessToken: string | null = null;
  private userPreferences: UserTimePreferences | null = null;

  /**
   * Initialize Google OAuth
   */
  async initializeGoogleAuth(): Promise<string | null> {
    try {
      // In a real implementation, this would handle Google OAuth flow
      const response = await fetch('/api/optimail/calendar/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Google OAuth initialization failed');

      const data = await response.json();
      return data.authUrl;

    } catch (error) {
      console.error('Google OAuth error:', error);
      return null;
    }
  }

  /**
   * Set access token after OAuth completion
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get user's calendar free/busy information
   */
  async getFreeBusyInfo(
    attendeeEmails: string[],
    timeMin: string,
    timeMax: string
  ): Promise<{ [email: string]: TimeWindow[] }> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    try {
      const response = await fetch('/api/optimail/calendar/freebusy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          attendees: attendeeEmails,
          timeMin,
          timeMax
        })
      });

      if (!response.ok) throw new Error('Free/busy query failed');

      const data = await response.json();
      return data.freeBusy || {};

    } catch (error) {
      console.error('Free/busy query error:', error);
      return {};
    }
  }

  /**
   * Generate 3 smart meeting slots
   */
  async generateSmartSlots(
    attendees: string[],
    durationMinutes: number = 60,
    daysAhead: number = 14
  ): Promise<SmartSlot[]> {
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

      // Get free/busy information for all attendees
      const freeBusyData = await this.getFreeBusyInfo(attendees, timeMin, timeMax);

      // Get user's time preferences
      const preferences = await this.getUserTimePreferences();

      // Generate smart slots
      const slots = this.calculateOptimalSlots(
        freeBusyData,
        preferences,
        durationMinutes,
        timeMin,
        timeMax
      );

      return slots.slice(0, 3); // Return top 3 slots

    } catch (error) {
      console.error('Smart slot generation error:', error);
      return [];
    }
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(
    slot: SmartSlot,
    subject: string,
    description: string,
    attendees: string[]
  ): Promise<CalendarEvent | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    try {
      const response = await fetch('/api/optimail/calendar/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          summary: subject,
          description,
          start: {
            dateTime: slot.start,
            timeZone: this.userPreferences?.timezone || 'UTC'
          },
          end: {
            dateTime: slot.end,
            timeZone: this.userPreferences?.timezone || 'UTC'
          },
          attendees: attendees.map(email => ({ email }))
        })
      });

      if (!response.ok) throw new Error('Event creation failed');

      const event = await response.json();
      return event;

    } catch (error) {
      console.error('Event creation error:', error);
      return null;
    }
  }

  /**
   * Get user's time preferences
   */
  private async getUserTimePreferences(): Promise<UserTimePreferences> {
    if (this.userPreferences) {
      return this.userPreferences;
    }

    try {
      const response = await fetch('/api/optimail/calendar/preferences');
      if (response.ok) {
        this.userPreferences = await response.json();
        return this.userPreferences!;
      }
    } catch (error) {
      console.error('Failed to load time preferences:', error);
    }

    // Default preferences
    this.userPreferences = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      workingHours: { start: '09:00', end: '17:00' },
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      preferredMeetingDuration: 60,
      bufferTime: 15,
      unavailableTimes: []
    };

    return this.userPreferences;
  }

  /**
   * Calculate optimal meeting slots
   */
  private calculateOptimalSlots(
    freeBusyData: { [email: string]: TimeWindow[] },
    preferences: UserTimePreferences,
    durationMinutes: number,
    timeMin: string,
    timeMax: string
  ): SmartSlot[] {
    const slots: SmartSlot[] = [];
    const attendees = Object.keys(freeBusyData);

    // Generate time slots for each day
    const startDate = new Date(timeMin);
    const endDate = new Date(timeMax);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip non-working days
      if (!preferences.workingDays.includes(date.getDay())) {
        continue;
      }

      // Generate slots for this day
      const daySlots = this.generateDaySlots(
        date,
        freeBusyData,
        preferences,
        durationMinutes,
        attendees
      );

      slots.push(...daySlots);
    }

    // Sort by confidence and time
    return slots.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  /**
   * Generate slots for a specific day
   */
  private generateDaySlots(
    date: Date,
    freeBusyData: { [email: string]: TimeWindow[] },
    preferences: UserTimePreferences,
    durationMinutes: number,
    attendees: string[]
  ): SmartSlot[] {
    const slots: SmartSlot[] = [];

    // Working hours for this day
    const workStart = new Date(date);
    const [startHour, startMin] = preferences.workingHours.start.split(':').map(Number);
    workStart.setHours(startHour, startMin, 0, 0);

    const workEnd = new Date(date);
    const [endHour, endMin] = preferences.workingHours.end.split(':').map(Number);
    workEnd.setHours(endHour, endMin, 0, 0);

    // Generate 30-minute intervals
    const slotDuration = 30; // minutes
    for (let time = new Date(workStart); time <= workEnd; time.setMinutes(time.getMinutes() + slotDuration)) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time.getTime() + durationMinutes * 60 * 1000);

      // Check if slot fits within working hours
      if (slotEnd > workEnd) continue;

      // Check availability for all attendees
      const conflicts = this.checkConflicts(slotStart, slotEnd, freeBusyData, attendees);
      
      if (conflicts.length === 0) {
        const confidence = this.calculateSlotConfidence(slotStart, preferences);
        
        slots.push({
          id: `slot_${slotStart.getTime()}`,
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          duration: durationMinutes,
          confidence,
          reasoning: this.generateSlotReasoning(slotStart, confidence),
          attendees,
          conflicts: []
        });
      }
    }

    return slots;
  }

  /**
   * Check for scheduling conflicts
   */
  private checkConflicts(
    start: Date,
    end: Date,
    freeBusyData: { [email: string]: TimeWindow[] },
    attendees: string[]
  ): string[] {
    const conflicts: string[] = [];

    attendees.forEach(email => {
      const busyTimes = freeBusyData[email] || [];
      
      busyTimes.forEach(busyTime => {
        const busyStart = new Date(busyTime.start);
        const busyEnd = new Date(busyTime.end);
        
        // Check for overlap
        if (start < busyEnd && end > busyStart) {
          conflicts.push(`${email} has conflict from ${busyStart.toLocaleTimeString()} to ${busyEnd.toLocaleTimeString()}`);
        }
      });
    });

    return conflicts;
  }

  /**
   * Calculate confidence score for a time slot
   */
  private calculateSlotConfidence(start: Date, preferences: UserTimePreferences): number {
    let confidence = 0.5; // Base confidence

    // Prefer mid-morning and early afternoon
    const hour = start.getHours();
    if (hour >= 10 && hour <= 11) {
      confidence += 0.3; // Prime morning time
    } else if (hour >= 14 && hour <= 15) {
      confidence += 0.2; // Good afternoon time
    } else if (hour === 9 || hour === 16) {
      confidence += 0.1; // Acceptable times
    }

    // Prefer earlier in the week
    const dayOfWeek = start.getDay();
    if (dayOfWeek === 2 || dayOfWeek === 3) { // Tuesday, Wednesday
      confidence += 0.1;
    }

    // Avoid Mondays and Fridays slightly
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      confidence -= 0.05;
    }

    // Apply buffer time preferences
    if (preferences.bufferTime > 30) {
      confidence += 0.05; // Reward longer buffer times
    }

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Generate reasoning text for slot suggestion
   */
  private generateSlotReasoning(start: Date, confidence: number): string {
    const hour = start.getHours();
    const dayName = start.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (confidence > 0.8) {
      return `Optimal time: ${dayName} ${hour}:${start.getMinutes().toString().padStart(2, '0')} - prime focus hours, all attendees free`;
    } else if (confidence > 0.6) {
      return `Good time: ${dayName} ${hour}:${start.getMinutes().toString().padStart(2, '0')} - good availability for all attendees`;
    } else {
      return `Available: ${dayName} ${hour}:${start.getMinutes().toString().padStart(2, '0')} - all attendees free`;
    }
  }

  /**
   * Parse attendees from email thread
   */
  parseAttendeesFromThread(emailContent: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = emailContent.match(emailRegex) || [];
    
    // Remove duplicates and common domains
    const uniqueEmails = [...new Set(emails)];
    return uniqueEmails.filter(email => 
      !email.includes('noreply') && 
      !email.includes('no-reply') &&
      !email.endsWith('.png') &&
      !email.endsWith('.jpg')
    );
  }
  /**
   * Create a calendar event
   */
  async createEvent(eventData: {
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
  }) {
    try {
      const response = await fetch('/api/optimail/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }

      const createdEvent = await response.json();
      return createdEvent;
    } catch (error) {
      console.error('Calendar event creation error:', error);
      throw error;
    }
  }
}

const calendarService = new CalendarService();
export default calendarService;
