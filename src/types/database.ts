export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          full_name?: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          full_name?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          module: 'superficial' | 'mailgent' | 'shopora' | 'jobvera' | 'travelbuddy';
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module: 'superficial' | 'mailgent' | 'shopora' | 'jobvera' | 'travelbuddy';
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          module?: 'superficial' | 'mailgent' | 'shopora' | 'jobvera' | 'travelbuddy';
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata?: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: 'light' | 'dark' | 'system';
          language: string;
          ai_model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: 'light' | 'dark' | 'system';
          language?: string;
          ai_model?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: 'light' | 'dark' | 'system';
          language?: string;
          ai_model?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      waitlist_users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          referral_source?: string;
          metadata?: Record<string, unknown>;
          subscribed?: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          referral_source?: string;
          metadata?: Record<string, unknown>;
          subscribed?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          referral_source?: string;
          metadata?: Record<string, unknown>;
          subscribed?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
