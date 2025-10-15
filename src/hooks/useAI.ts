import { useState } from 'react';

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EmailData {
  to?: string;
  subject?: string;
  body?: string;
  originalEmail?: string;
  purpose?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
  language?: string;
}

interface ShoppingData {
  query?: string;
  products?: Array<{
    name: string;
    price: number;
    retailer: string;
    rating?: number;
    features?: string[];
  }>;
  budget?: {
    min: number;
    max: number;
  };
  preferences?: {
    categories?: string[];
    brands?: string[];
    features?: string[];
  };
}

interface OptiHireData {
  resume?: string;
  jobDescription?: string;
  position?: string;
  company?: string;
  experience?: string[];
  skills?: string[];
  goals?: string[];
  industry?: string;
  careerLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}

interface TravelBuddyData {
  destination?: string;
  dates?: {
    start: string;
    end: string;
  };
  budget?: {
    total: number;
    currency: string;
  };
  travelers?: {
    adults: number;
    children: number;
  };
  preferences?: {
    accommodation?: string[];
    activities?: string[];
    dining?: string[];
    transportation?: string[];
  };
  currentLocation?: string;
}

export function useAI() {
  const [response, setResponse] = useState<ApiResponse>({
    data: null,
    error: null,
    loading: false,
  });

  const sendMessage = async (
    message: string,
    module: string = 'superficial',
    conversation: ChatMessage[] = []
  ) => {
    setResponse({ data: null, error: null, loading: true });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          module,
          conversation: conversation.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await res.json();
      setResponse({ data, error: null, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResponse({ data: null, error: errorMessage, loading: false });
      throw error;
    }
  };

  const callOptiMail = async (action: string, emailData: EmailData, instructions?: string) => {
    setResponse({ data: null, error: null, loading: true });

    try {
      const res = await fetch('/api/optimail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          emailData,
          instructions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get OptiMail response');
      }

      const data = await res.json();
      setResponse({ data, error: null, loading: false });
      
      // Return just the result for easier consumption
      return data.result || data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResponse({ data: null, error: errorMessage, loading: false });
      throw error;
    }
  };

  const callOptiShop = async (action: string, requestData: ShoppingData, instructions?: string) => {
    setResponse({ data: null, error: null, loading: true });

    try {
      const res = await fetch('/api/optishop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...requestData,
          instructions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get Shopora response');
      }

      const data = await res.json();
      setResponse({ data, error: null, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResponse({ data: null, error: errorMessage, loading: false });
      throw error;
    }
  };

  const callOptiHire = async (action: string, data: OptiHireData, instructions?: string) => {
    setResponse({ data: null, error: null, loading: true });

    try {
      const res = await fetch('/api/optihire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data,
          instructions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get Jobvera response');
      }

      const responseData = await res.json();
      setResponse({ data: responseData, error: null, loading: false });
      return responseData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResponse({ data: null, error: errorMessage, loading: false });
      throw error;
    }
  };

  const callOptiTrip = async (action: string, requestData: TravelBuddyData, instructions?: string) => {
    setResponse({ data: null, error: null, loading: true });

    try {
      const res = await fetch('/api/optitrip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...requestData,
          instructions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get TravelBuddy response');
      }

      const data = await res.json();
      setResponse({ data, error: null, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResponse({ data: null, error: errorMessage, loading: false });
      throw error;
    }
  };

  return {
    ...response,
    sendMessage,
    callOptiMail,
    callOptiShop,
    callOptiHire,
    callOptiTrip,
  };
}

export type { ChatMessage, ApiResponse };
