// Client-only helpers for lightweight email content analysis (no server SDKs)

export function detectMeetingRequests(emailContent: string): {
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

  const hasMeetingRequest = meetingKeywords.some(keyword => emailLower.includes(keyword));

  const urgency = urgentKeywords.some(keyword => emailLower.includes(keyword)) ? 'high' : 'medium';

  const durationPatterns = [
    /(\d+)\s*(?:hour|hr)s?/gi,
    /(\d+)\s*(?:minute|min)s?/gi,
    /half\s*hour/gi,
    /quick\s*(?:chat|call)/gi
  ];

  let suggestedDuration = 30;
  for (const pattern of durationPatterns) {
    const match = emailContent.match(pattern as unknown as RegExp);
    if (match) {
      const m0 = String(match[0]).toLowerCase();
      const numMatch = /\d+/.exec(m0);
      if (m0.includes('hour') || m0.includes('hr')) {
        suggestedDuration = numMatch ? parseInt(numMatch[0], 10) * 60 : 60;
      } else if (m0.includes('minute') || m0.includes('min')) {
        suggestedDuration = numMatch ? parseInt(numMatch[0], 10) : 30;
      } else if (m0.includes('half hour')) {
        suggestedDuration = 30;
      } else if (m0.includes('quick')) {
        suggestedDuration = 15;
      }
      break;
    }
  }

  const emailPattern = /[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/g;
  const detectedAttendees = emailContent.match(emailPattern) || [];

  const titleSentence = emailContent
    .split(/[.!?]/)
    .find(sentence => meetingKeywords.some(k => sentence.toLowerCase().includes(k))) || 'Meeting';

  const suggestedTitle = titleSentence.slice(0, 50).trim() + (titleSentence.length > 50 ? '...' : '');

  return {
    hasMeetingRequest,
    suggestedDuration,
    suggestedTitle,
    urgency: urgency as 'low' | 'medium' | 'high',
    detectedAttendees
  };
}
