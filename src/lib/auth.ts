import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, username: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        }
      }
    });

    if (error) throw error;

    // Create user profile in our users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          username,
          full_name: fullName,
        });

      if (profileError) throw profileError;
    }

    return data;
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Get additional profile data
    const { data: profile } = await supabase
      .from('users')
      .select('username, full_name, avatar_url')
      .eq('id', user.id)
      .single();

    return {
      ...user,
      username: profile?.username,
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url,
    };
  },

  // Update user profile
  async updateProfile(userId: string, updates: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }) {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  // Get user preferences
  async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
  },

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    ai_model?: string;
  }) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Listen to auth changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};
