import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    // Simple authentication check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer admin123') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all waitlist users
    const { data, error } = await supabase
      .from('waitlist_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching waitlist users:', error);
      return NextResponse.json(
        { error: 'Unable to fetch waitlist data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      users: data
    }, { status: 200 });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
