// API route to initialize basic Supabase tables
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for DDL operations
    
    if (!url || !key) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials (need SERVICE_ROLE_KEY for table creation)'
      }, { status: 500 });
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false }
    });

    // Test if tables already exist
    const { error: checkError } = await supabase
      .from('waitlist_users')
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Database tables already exist',
        recommendation: 'Run diagnostics to verify all tables are accessible'
      });
    }

    // If tables don't exist, provide setup instructions
    return NextResponse.json({
      success: false,
      error: 'Database tables not found',
      message: 'Tables need to be created',
      instructions: {
        method1: 'Copy supabase-schema.sql content to Supabase Dashboard > SQL Editor',
        method2: 'Use Supabase CLI: supabase db push',
        dashboardUrl: 'https://supabase.com/dashboard/project/ryqgkywrpuondmpfmhca',
        sqlEditorUrl: 'https://supabase.com/dashboard/project/ryqgkywrpuondmpfmhca/sql'
      }
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database initialization failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Supabase Database Initialization',
    usage: 'POST to this endpoint to check/initialize database tables',
    status: 'Use POST method to run initialization check',
    instructions: 'See SUPABASE-SETUP-INSTRUCTIONS.md for manual setup'
  });
}
