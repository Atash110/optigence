/**
 * OptiMail Memory & Context Service
 * Phase 5: Supabase integration for persistent user memory and email history
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserMemory {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  signature?: string;
  preferred_tone: 'professional' | 'casual' | 'friendly' | 'formal';
  language: string;
  timezone?: string;
  voice_provider: 'whisper' | 'deepgram' | 'browser';
  enhanced_processing: boolean;
  email_patterns: EmailPattern[];
  contacts: Contact[];
  created_at: string;
  updated_at: string;
}

export interface EmailPattern {
  recipient_pattern: string;
  subject_pattern: string;
  tone_override?: string;
  template?: string;
  priority: 'low' | 'medium' | 'high';
  frequency: number;
}

export interface Contact {
  name: string;
  email: string;
  relationship: 'colleague' | 'client' | 'friend' | 'family' | 'other';
  preferred_tone?: string;
  notes?: string;
  last_contacted?: string;
}

export interface EmailHistory {
  id: string;
  user_id: string;
  thread_id?: string;
  intent: string;
  original_input: string;
  voice_transcript?: string;
  generated_email: string;
  chosen_alternative?: string;
  recipient?: string;
  subject?: string;
  tone: string;
  entities: {
    attendees?: string[];
    dates?: string[];
    places?: string[];
  };
  voice_metadata?: {
    provider: string;
    confidence: number;
    duration: number;
    emotional_tone?: string;
  };
  feedback_rating?: number;
  sent: boolean;
  created_at: string;
}

export interface ContextWindow {
  recent_emails: EmailHistory[];
  active_threads: string[];
  current_contacts: Contact[];
  user_preferences: UserMemory;
  temporal_context: {
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
    day_of_week: string;
    is_weekend: boolean;
    is_holiday?: boolean;
  };
}

class MemoryContextService {
  private supabase: SupabaseClient;
  private userId: string | null = null;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, memory features will be limited');
      // Create a mock client for development
      this.supabase = {} as SupabaseClient;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Initialize user session and load memory
   */
  async initializeUser(userId: string): Promise<UserMemory> {
    this.userId = userId;

    try {
      // Check if user memory exists
      const { data: existingMemory, error } = await this.supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (existingMemory) {
        return existingMemory as UserMemory;
      }

      // Create new user memory
      const newMemory: Partial<UserMemory> = {
        user_id: userId,
        preferred_tone: 'professional',
        language: 'en-US',
        voice_provider: 'whisper',
        enhanced_processing: true,
        email_patterns: [],
        contacts: []
      };

      const { data: createdMemory, error: createError } = await this.supabase
        .from('user_memory')
        .insert([newMemory])
        .select()
        .single();

      if (createError) throw createError;

      return createdMemory as UserMemory;

    } catch (error) {
      console.error('Failed to initialize user memory:', error);
      // Return default memory for offline mode
      return {
        id: 'offline',
        user_id: userId,
        preferred_tone: 'professional',
        language: 'en-US',
        voice_provider: 'whisper',
        enhanced_processing: true,
        email_patterns: [],
        contacts: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Update user memory preferences
   */
  async updateUserMemory(updates: Partial<UserMemory>): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const { error } = await this.supabase
        .from('user_memory')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', this.userId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update user memory:', error);
    }
  }

  /**
   * Save email to history
   */
  async saveEmailHistory(emailData: Omit<EmailHistory, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const historyEntry: Partial<EmailHistory> = {
        ...emailData,
        user_id: this.userId,
        created_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('email_history')
        .insert([historyEntry]);

      if (error) throw error;

      // Learn from this email for future patterns
      await this.learnFromEmail(emailData);

    } catch (error) {
      console.error('Failed to save email history:', error);
    }
  }

  /**
   * Learn patterns from email interactions
   */
  private async learnFromEmail(emailData: Omit<EmailHistory, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    if (!emailData.recipient || !emailData.subject) return;

    try {
      // Get current user memory
      const { data: userMemory } = await this.supabase
        .from('user_memory')
        .select('email_patterns')
        .eq('user_id', this.userId)
        .single();

      if (!userMemory) return;

      const patterns = userMemory.email_patterns || [];
      
      // Find existing pattern or create new one
      const existingPatternIndex = patterns.findIndex(
        (p: EmailPattern) => 
          p.recipient_pattern === emailData.recipient &&
          emailData.subject && p.subject_pattern.toLowerCase().includes(emailData.subject.toLowerCase().split(' ')[0])
      );

      if (existingPatternIndex >= 0) {
        // Update existing pattern
        patterns[existingPatternIndex].frequency += 1;
        patterns[existingPatternIndex].tone_override = emailData.tone;
      } else {
        // Create new pattern
        patterns.push({
          recipient_pattern: emailData.recipient,
          subject_pattern: emailData.subject.split(' ').slice(0, 3).join(' '), // First 3 words
          tone_override: emailData.tone,
          priority: 'medium',
          frequency: 1
        });
      }

      // Update patterns in database
      await this.supabase
        .from('user_memory')
        .update({ 
          email_patterns: patterns,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', this.userId);

    } catch (error) {
      console.error('Failed to learn from email:', error);
    }
  }

  /**
   * Get recent email history
   */
  async getRecentEmails(limit: number = 10): Promise<EmailHistory[]> {
    if (!this.userId) return [];

    try {
      const { data, error } = await this.supabase
        .from('email_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as EmailHistory[];

    } catch (error) {
      console.error('Failed to get recent emails:', error);
      return [];
    }
  }

  /**
   * Get context window for intelligent email generation
   */
  async getContextWindow(): Promise<ContextWindow> {
    if (!this.userId) {
      return this.getOfflineContext();
    }

    try {
      const [userMemory, recentEmails] = await Promise.all([
        this.getUserMemory(),
        this.getRecentEmails(5)
      ]);

      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;

      let timeOfDay: ContextWindow['temporal_context']['time_of_day'];
      if (hour < 12) timeOfDay = 'morning';
      else if (hour < 17) timeOfDay = 'afternoon';
      else if (hour < 21) timeOfDay = 'evening';
      else timeOfDay = 'night';

      return {
        recent_emails: recentEmails,
        active_threads: [...new Set(recentEmails.filter(e => e.thread_id).map(e => e.thread_id!))],
        current_contacts: userMemory.contacts,
        user_preferences: userMemory,
        temporal_context: {
          time_of_day: timeOfDay,
          day_of_week: dayOfWeek,
          is_weekend: isWeekend
        }
      };

    } catch (error) {
      console.error('Failed to get context window:', error);
      return this.getOfflineContext();
    }
  }

  /**
   * Get user memory
   */
  private async getUserMemory(): Promise<UserMemory> {
    const { data, error } = await this.supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) throw error;
    return data as UserMemory;
  }

  /**
   * Offline context fallback
   */
  private getOfflineContext(): ContextWindow {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    let timeOfDay: ContextWindow['temporal_context']['time_of_day'];
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      recent_emails: [],
      active_threads: [],
      current_contacts: [],
      user_preferences: {
        id: 'offline',
        user_id: 'offline',
        preferred_tone: 'professional',
        language: 'en-US',
        voice_provider: 'whisper',
        enhanced_processing: true,
        email_patterns: [],
        contacts: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      temporal_context: {
        time_of_day: timeOfDay,
        day_of_week: dayOfWeek,
        is_weekend: isWeekend
      }
    };
  }

  /**
   * Add or update contact
   */
  async addContact(contact: Omit<Contact, 'last_contacted'>): Promise<void> {
    if (!this.userId) return;

    try {
      const userMemory = await this.getUserMemory();
      const contacts = userMemory.contacts || [];
      
      const existingIndex = contacts.findIndex(c => c.email === contact.email);
      
      if (existingIndex >= 0) {
        contacts[existingIndex] = { ...contacts[existingIndex], ...contact };
      } else {
        contacts.push({ ...contact, last_contacted: new Date().toISOString() });
      }

      await this.updateUserMemory({ contacts });

    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  }

  /**
   * Get email suggestions based on context and patterns
   */
  async getEmailSuggestions(input: string): Promise<{
    suggestedTone?: string;
    suggestedRecipients?: string[];
    templateSuggestion?: string;
    contextHints?: string[];
  }> {
    try {
      const context = await this.getContextWindow();
      const patterns = context.user_preferences.email_patterns;
      
      const suggestions: {
        suggestedTone?: string;
        suggestedRecipients?: string[];
        templateSuggestion?: string;
        contextHints: string[];
      } = {
        contextHints: []
      };

      // Check for matching patterns
      const matchingPattern = patterns.find(pattern => 
        input.toLowerCase().includes(pattern.subject_pattern.toLowerCase()) ||
        input.toLowerCase().includes(pattern.recipient_pattern.toLowerCase())
      );

      if (matchingPattern) {
        suggestions.suggestedTone = matchingPattern.tone_override;
        suggestions.templateSuggestion = matchingPattern.template;
        suggestions.contextHints.push(`Similar emails usually use ${matchingPattern.tone_override} tone`);
      }

      // Time-based suggestions
      if (context.temporal_context.time_of_day === 'morning') {
        suggestions.contextHints.push("Good morning greeting might be appropriate");
      } else if (context.temporal_context.time_of_day === 'evening') {
        suggestions.contextHints.push("Consider end-of-day timing for response expectations");
      }

      // Weekend context
      if (context.temporal_context.is_weekend) {
        suggestions.contextHints.push("Note: Sending during weekend - consider urgency");
      }

      return suggestions;

    } catch (error) {
      console.error('Failed to get email suggestions:', error);
      return {};
    }
  }
}

export default MemoryContextService;
