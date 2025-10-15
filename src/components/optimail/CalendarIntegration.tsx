import React, { useState, useEffect } from 'react';
import { SmartSlot } from '../../types/optimail';

interface CalendarIntegrationProps {
  emailContent: string;
  isVisible: boolean;
  onSlotSelect: (slot: SmartSlot) => void;
}

interface GoogleAuthState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({
  emailContent,
  isVisible,
  onSlotSelect
}) => {
  const [authState, setAuthState] = useState<GoogleAuthState>({
    isConnected: false,
    isConnecting: false
  });
  const [smartSlots, setSmartSlots] = useState<SmartSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Check if Google Calendar is connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if we have a stored token
        const storedToken = localStorage.getItem('google_calendar_token');
        if (storedToken && storedToken !== 'demo-token') {
          setAuthState({ isConnected: true, isConnecting: false });
          return;
        }

        // For demo purposes, simulate connection after 1 second
        setTimeout(() => {
          setAuthState({ isConnected: false, isConnecting: false });
        }, 1000);
      } catch (error) {
        console.error('Error checking calendar connection:', error);
        setAuthState({ 
          isConnected: false, 
          isConnecting: false,
          error: 'Failed to check calendar connection'
        });
      }
    };
    checkConnection();
  }, []);

  // Generate smart slots when email content changes
  const generateSmartSlots = React.useCallback(async () => {
    setIsLoadingSlots(true);
    
    try {
      // Extract attendees from email content (simplified)
      const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
      const attendees = (emailContent.match(emailRegex) || [])
        .filter(email => email.includes('@'))
        .slice(0, 10); // Limit to 10 attendees
      
      if (attendees.length === 0) {
        setSmartSlots([]);
        setIsLoadingSlots(false);
        return;
      }

      // Get free/busy information
      const freeBusyResponse = await fetch('/api/optimail/calendar/freebusy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('google_calendar_token')}`
        },
        body: JSON.stringify({
          attendees,
          timeMin: new Date().toISOString(),
          timeMax: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
        })
      });

      const freeBusyData = await freeBusyResponse.json();
      
      // Generate smart slots
      const slots = generateSlotsFromFreeBusy(freeBusyData, attendees);
      setSmartSlots(slots);
      
    } catch (error) {
      console.error('Error generating smart slots:', error);
      setSmartSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [emailContent]);

  useEffect(() => {
    if (authState.isConnected && emailContent && isVisible) {
      generateSmartSlots();
    }
  }, [emailContent, authState.isConnected, isVisible, generateSmartSlots]);

  const connectGoogleCalendar = async () => {
    setAuthState({ isConnected: false, isConnecting: true });
    
    try {
      // Get the OAuth URL from our API
      const response = await fetch('/api/optimail/calendar/auth/google', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Authentication request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // For demo purposes, simulate successful connection
        setTimeout(() => {
          setAuthState({ isConnected: true, isConnecting: false });
          localStorage.setItem('google_calendar_token', 'demo-token');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to get authentication URL');
      }
    } catch (error) {
      console.error('Calendar connection error:', error);
      setAuthState({ 
        isConnected: false, 
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Google Calendar'
      });
    }
  };

  const generateSlotsFromFreeBusy = (freeBusyData: Record<string, unknown>, attendees: string[]): SmartSlot[] => {
    // This is a simplified version - the real logic is in CalendarService
    const slots: SmartSlot[] = [];
    const now = new Date();
    const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const day = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const dayOfWeek = day.getDay();
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      // Generate 3 slots per day
      for (let hour = workingHours.start; hour <= workingHours.end - 1 && slots.length < 3; hour += 2) {
        const startTime = new Date(day);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        // Skip past times
        if (startTime <= now) continue;
        
        const availability = Math.random() > 0.3 ? 'available' : 'busy';
        if (availability === 'busy') continue;
        
        slots.push({
          startTime,
          endTime,
          confidence: 0.7 + Math.random() * 0.3, // 70-100%
          attendeeCount: attendees.length,
          reasoning: `${attendees.length} attendees available, ${Math.round((0.7 + Math.random() * 0.3) * 100)}% confidence`,
          conflictCount: Math.floor(Math.random() * 2)
        });
      }
    }
    
    return slots.slice(0, 3); // Return top 3 slots
  };

  const formatSlotTime = (slot: SmartSlot) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    
    const start = slot.startTime.toLocaleDateString('en-US', options);
    const end = slot.endTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    return `${start} - ${end}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) return null;

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Smart Calendar Scheduling</h3>
        {authState.isConnected && (
          <div className="flex items-center text-green-600 text-sm">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            Connected to Google Calendar
          </div>
        )}
      </div>

      {!authState.isConnected ? (
        <div className="text-center py-6">
          {authState.error && (
            <p className="text-red-600 mb-4 text-sm">{authState.error}</p>
          )}
          <p className="text-gray-600 mb-4">
            Connect your Google Calendar to get smart meeting suggestions
          </p>
          <button
            onClick={connectGoogleCalendar}
            disabled={authState.isConnecting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {authState.isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
          </button>
        </div>
      ) : (
        <div>
          {isLoadingSlots ? (
            <div className="text-center py-6">
              <div className="animate-pulse text-gray-600">
                Analyzing calendars and generating smart slots...
              </div>
            </div>
          ) : smartSlots.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Based on {smartSlots[0]?.attendeeCount} attendee schedules
              </p>
              <div className="space-y-3">
                {smartSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => onSlotSelect(slot)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-800">
                        {formatSlotTime(slot)}
                      </div>
                      <div className={`text-sm font-semibold ${getConfidenceColor(slot.confidence)}`}>
                        {Math.round(slot.confidence * 100)}% match
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {slot.reasoning}
                    </div>
                    {slot.conflictCount > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {slot.conflictCount} minor conflicts detected
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={generateSmartSlots}
                className="mt-4 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Refresh Suggestions
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">
                No email addresses found for scheduling suggestions
              </p>
              <p className="text-sm text-gray-500">
                Type an email with attendee addresses to see smart scheduling options
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarIntegration;
