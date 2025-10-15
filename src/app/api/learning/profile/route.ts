/**
 * API Route: /api/learning/profile
 * Manages user personality profiles and learning data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { config } from '@/lib/config';

// Initialize Supabase client
const supabaseUrl = config.config.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = config.config.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration missing for learning API');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Validation schemas
const PersonalityProfileSchema = z.object({
  writingStyle: z.enum(['formal', 'casual', 'friendly', 'direct']),
  responseSpeed: z.enum(['immediate', 'thoughtful', 'delayed']),
  communicationPreference: z.enum(['concise', 'detailed', 'balanced']),
  tonePreference: z.enum(['professional', 'warm', 'neutral', 'assertive']),
  decisionMaking: z.enum(['quick', 'deliberate', 'collaborative'])
});

const UpdateProfileSchema = z.object({
  userId: z.string(),
  profile: PersonalityProfileSchema
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user learning profile
    const { data: profile, error } = await supabase
      .from('user_learning_profiles')
      .select('personality_traits')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!profile) {
      // Return default profile
      return NextResponse.json({
        writingStyle: 'formal',
        responseSpeed: 'thoughtful',
        communicationPreference: 'balanced',
        tonePreference: 'professional',
        decisionMaking: 'deliberate'
      });
    }

    return NextResponse.json(profile.personality_traits);

  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load personality profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, profile } = UpdateProfileSchema.parse(body);

    // Upsert user learning profile
    const { error } = await supabase
      .from('user_learning_profiles')
      .upsert({
        user_id: userId,
        personality_traits: profile,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Profile PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update personality profile' },
      { status: 500 }
    );
  }
}
