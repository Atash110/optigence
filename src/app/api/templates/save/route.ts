import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Input validation schema
const TemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  content: z.string().min(10, 'Template content too short'),
  category: z.enum(['business', 'personal', 'marketing', 'support', 'custom']).default('custom'),
  intent: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  topic: z.string().optional(),
  tone: z.string().optional(),
  language: z.string().default('en'),
  is_public: z.boolean().default(false),
  tier_required: z.enum(['Free', 'Pro', 'Elite']).default('Free')
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const templateData = TemplateSchema.parse(body);

    // Extract user ID from auth header or request (simplified for now)
    // TODO: Implement proper auth token validation
    const userId = request.headers.get('x-user-id') || 'anonymous';

    // Check if similar template already exists
    const { data: existingTemplates, error: searchError } = await supabase
      .from('mailgent_templates')
      .select('id, name, usage_count')
      .eq('user_id', userId)
      .ilike('name', `%${templateData.name}%`)
      .limit(5);

    if (searchError) {
      console.error('Template search error:', searchError);
    }

    // Create template record
    const { data: newTemplate, error: insertError } = await supabase
      .from('mailgent_templates')
      .insert({
        user_id: userId,
        name: templateData.name,
        description: `Auto-saved template for ${templateData.intent || templateData.category}`,
        category: templateData.category,
        template_content: templateData.content,
        tone: templateData.tone,
        is_public: templateData.is_public,
        tier_required: templateData.tier_required,
        usage_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Template insert error:', insertError);
      return NextResponse.json(
        { error: `Failed to save template: ${insertError.message}` },
        { status: 400 }
      );
    }

    // Create metadata record for pattern matching
    if (templateData.intent || templateData.topic) {
      const { error: metadataError } = await supabase
        .from('mailgent_memories')
        .insert({
          user_id: userId,
          context: `Template: ${templateData.name}`,
          email_pattern: templateData.intent || templateData.topic,
          frequency_score: 1,
          metadata: {
            template_id: newTemplate.id,
            recipients: templateData.recipients || [],
            topic: templateData.topic,
            tone: templateData.tone,
            language: templateData.language
          },
          created_at: new Date().toISOString()
        });

      if (metadataError) {
        console.warn('Template metadata save error:', metadataError);
      }
    }

    const duration = Date.now() - startTime;

    // Log success metrics
    try {
      console.log('Template saved', {
        template_id: newTemplate.id,
        category: templateData.category,
        intent: templateData.intent,
        content_length: templateData.content.length,
        duration_ms: duration,
        similar_templates: existingTemplates?.length || 0,
        success: true
      });
    } catch (logError) {
      console.warn('Failed to log template metrics:', logError);
    }

    return NextResponse.json({
      template: {
        id: newTemplate.id,
        name: newTemplate.name,
        category: newTemplate.category,
        created_at: newTemplate.created_at,
        usage_count: newTemplate.usage_count
      },
      similar_templates: existingTemplates?.slice(0, 3) || [],
      metadata: {
        duration_ms: duration,
        user_id: userId,
        language: templateData.language
      },
      suggestions: {
        auto_use_conditions: generateAutoUseConditions(templateData),
        similar_patterns: existingTemplates?.map(t => t.name) || []
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('Template save error:', error);
    
    // Log error metrics
    try {
      console.log('Template save failed', {
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } catch (logError) {
      console.warn('Failed to log error metrics:', logError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid template data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('mailgent_templates')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Template fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      templates: templates || [],
      count: templates?.length || 0,
      user_templates: templates?.filter(t => t.user_id === userId).length || 0,
      public_templates: templates?.filter(t => t.is_public).length || 0
    });

  } catch (error) {
    console.error('Template GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint to increment template usage
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id } = z.object({
      template_id: z.string().uuid()
    }).parse(body);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Increment usage count
    const { data, error } = await supabase
      .rpc('increment_template_usage', { template_id });

    if (error) {
      console.error('Template usage increment error:', error);
      return NextResponse.json(
        { error: 'Failed to update template usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, updated_at: new Date().toISOString() });

  } catch (error) {
    console.error('Template PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate conditions for automatic template usage
function generateAutoUseConditions(templateData: {
  intent?: string;
  recipients?: string[];
  topic?: string;
  tone?: string;
}) {
  const conditions = [];

  if (templateData.intent) {
    conditions.push(`When intent is "${templateData.intent}"`);
  }

  if (templateData.recipients && templateData.recipients.length > 0) {
    conditions.push(`When emailing ${templateData.recipients.slice(0, 2).join(' or ')}`);
  }

  if (templateData.topic) {
    conditions.push(`When discussing "${templateData.topic}"`);
  }

  if (templateData.tone) {
    conditions.push(`When using ${templateData.tone} tone`);
  }

  return conditions;
}
