/**
 * API Route: /api/learning/autosend
 * Manages auto-send metrics and adaptive thresholds
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
const AutoSendMetricsSchema = z.object({
  totalAutoSends: z.number().int().min(0),
  successfulAutoSends: z.number().int().min(0),
  canceledAutoSends: z.number().int().min(0),
  regrettedAutoSends: z.number().int().min(0),
  averageConfidenceAtSend: z.number().min(0).max(1),
  optimalConfidenceThreshold: z.number().min(0).max(1),
  lastThresholdUpdate: z.string().transform(str => new Date(str))
});

const UpdateMetricsSchema = z.object({
  userId: z.string(),
  metrics: AutoSendMetricsSchema
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user auto-send metrics
    const { data: profile, error } = await supabase
      .from('user_learning_profiles')
      .select('auto_send_history')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!profile || !profile.auto_send_history) {
      // Return default metrics
      return NextResponse.json({
        totalAutoSends: 0,
        successfulAutoSends: 0,
        canceledAutoSends: 0,
        regrettedAutoSends: 0,
        averageConfidenceAtSend: 0.85,
        optimalConfidenceThreshold: 0.85,
        lastThresholdUpdate: new Date().toISOString()
      });
    }

    return NextResponse.json(profile.auto_send_history);

  } catch (error) {
    console.error('AutoSend metrics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load auto-send metrics' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, metrics } = UpdateMetricsSchema.parse(body);

    // Upsert user learning profile with auto-send metrics
    const { error } = await supabase
      .from('user_learning_profiles')
      .upsert({
        user_id: userId,
        auto_send_history: {
          ...metrics,
          lastThresholdUpdate: metrics.lastThresholdUpdate.toISOString()
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('AutoSend metrics PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid metrics data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update auto-send metrics' },
      { status: 500 }
    );
  }
}
