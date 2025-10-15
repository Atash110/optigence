'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, authService } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { username?: string; full_name?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting initial user:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
      // User state will be updated by the auth listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string) => {
    setLoading(true);
    try {
      await authService.signUp(email, password, username, fullName);
      // User state will be updated by the auth listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      // User state will be updated by the auth listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateProfile = async (updates: { username?: string; full_name?: string; avatar_url?: string }) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await authService.updateProfile(user.id, updates);
      // Refresh user data
      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
