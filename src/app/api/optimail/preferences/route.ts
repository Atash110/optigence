import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { UserPreferences } from '@/types/optimail';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from token (simplified - in production, verify JWT)
    const token = authHeader.split(' ')[1];
    // For now, we'll extract user ID from token directly
    // In production, verify and decode the JWT token
    
    const { data: user } = await supabase.auth.getUser(token);
    if (!user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('id', user.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Return default preferences if none found
    const preferences: UserPreferences = profile || {
      userId: user.user.id,
      tone: 'professional',
      language: 'en',
      autoIncludeSignature: true,
      signature: ''
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: user } = await supabase.auth.getUser(token);
    if (!user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const preferences: Partial<UserPreferences> = await req.json();

    const updateData = {
      id: user.user.id,
      email: user.user.email,
      locales: preferences.language ? [preferences.language] : ['en'],
      default_tone: preferences.tone || 'professional',
      signature_html: preferences.signature || '',
      auto_include_signature: preferences.autoIncludeSignature ?? true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_profile')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    // Transform back to UserPreferences format
    const savedPreferences: UserPreferences = {
      userId: data.id,
      tone: data.default_tone,
      language: data.locales?.[0] || 'en',
      signature: data.signature_html,
      autoIncludeSignature: data.auto_include_signature,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json(savedPreferences);
  } catch (error) {
    console.error('Preferences POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
