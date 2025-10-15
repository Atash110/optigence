import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { EmailTemplate } from '@/types/optimail';

export async function GET(req: NextRequest) {
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

    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .eq('owner_id', user.user.id)
      .order('usage_count', { ascending: false })
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Templates fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Transform database format to EmailTemplate type
    const formattedTemplates: EmailTemplate[] = templates?.map(template => ({
      id: template.id,
      title: template.title,
      content: template.body,
      language: template.language,
      tone: template.tone_override || 'professional',
      createdAt: template.created_at,
      updatedAt: template.updated_at || template.created_at
    })) || [];

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    console.error('Templates GET error:', error);
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

    const templateData: Partial<EmailTemplate> = await req.json();

    if (!templateData.title || !templateData.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const insertData = {
      title: templateData.title,
      body: templateData.content,
      tags: [], // Can be extended later
      intent: 'compose', // Default intent
      language: templateData.language || 'en',
      tone_override: templateData.tone || 'professional',
      owner_id: user.user.id,
      usage_count: 0,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('templates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Template save error:', error);
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
    }

    const savedTemplate: EmailTemplate = {
      id: data.id,
      title: data.title,
      content: data.body,
      language: data.language,
      tone: data.tone_override,
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at
    };

    return NextResponse.json(savedTemplate);
  } catch (error) {
    console.error('Templates POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Update template usage
export async function PATCH(req: NextRequest) {
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

    const { templateId } = await req.json();
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // First get current usage count, then increment
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('usage_count')
      .eq('id', templateId)
      .eq('owner_id', user.user.id)
      .single();

    if (fetchError) {
      console.error('Template fetch error:', fetchError);
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Increment usage count and update last used timestamp
    const { error } = await supabase
      .from('templates')
      .update({
        usage_count: (template.usage_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('owner_id', user.user.id);

    if (error) {
      console.error('Template usage update error:', error);
      return NextResponse.json({ error: 'Failed to update template usage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Templates PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
