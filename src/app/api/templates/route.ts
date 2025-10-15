import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase';

// Input validation schemas
const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  category: z.enum(['interview_scheduling', 'follow_up', 'meeting_request', 'status_update', 'general']),
  subject_template: z.string().min(1, 'Subject template is required'),
  body_template: z.string().min(1, 'Body template is required'),
  variables: z.array(z.string()).default([]),
  tone: z.enum(['professional', 'friendly', 'formal', 'casual']).default('professional'),
  language: z.string().default('en'),
  is_public: z.boolean().default(false)
});

const UpdateTemplateSchema = CreateTemplateSchema.partial();

const ListTemplatesSchema = z.object({
  category: z.enum(['interview_scheduling', 'follow_up', 'meeting_request', 'status_update', 'general']).optional(),
  language: z.string().optional(),
  user_only: z.boolean().default(false)
});

// Hardcoded fallback templates when Supabase is unavailable
const FALLBACK_TEMPLATES = [
  {
    id: 'fallback-interview-1',
    name: 'Interview Scheduling - Standard',
    category: 'interview_scheduling',
    subject_template: 'Interview Opportunity - {{position}} at {{company}}',
    body_template: `Hi {{candidate_name}},

I hope this email finds you well. I'm reaching out regarding the {{position}} position at {{company}}.

Based on your background, I believe you'd be a great fit for this role. Would you be available for a brief conversation to discuss the opportunity?

I'm flexible with timing and can accommodate your schedule. Please let me know what works best for you.

Best regards,
{{recruiter_name}}`,
    variables: ['candidate_name', 'position', 'company', 'recruiter_name'],
    tone: 'professional',
    language: 'en',
    is_public: true,
    user_id: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fallback-followup-1',
    name: 'Follow-up - Standard',
    category: 'follow_up',
    subject_template: 'Following up on our conversation',
    body_template: `Hi {{contact_name}},

I wanted to follow up on our conversation from {{date}}. 

{{custom_message}}

Please let me know if you have any questions or if there's anything I can help clarify.

Looking forward to hearing from you.

Best regards,
{{sender_name}}`,
    variables: ['contact_name', 'date', 'custom_message', 'sender_name'],
    tone: 'professional',
    language: 'en',
    is_public: true,
    user_id: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fallback-meeting-1',
    name: 'Meeting Request - Standard',
    category: 'meeting_request',
    subject_template: 'Meeting Request - {{topic}}',
    body_template: `Hi {{recipient_name}},

I'd like to schedule a meeting to discuss {{topic}}.

Proposed times:
{{time_slots}}

The meeting should take approximately {{duration}} minutes and can be held {{format}}.

Please let me know which time works best for you, or suggest alternative times if none of these work.

Best regards,
{{sender_name}}`,
    variables: ['recipient_name', 'topic', 'time_slots', 'duration', 'format', 'sender_name'],
    tone: 'professional',
    language: 'en',
    is_public: true,
    user_id: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// GET: List templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { category, language, user_only } = ListTemplatesSchema.parse({
      category: searchParams.get('category') || undefined,
      language: searchParams.get('language') || undefined,
      user_only: searchParams.get('user_only') === 'true'
    });

    // Try Supabase first
    try {
      const supabase = createClient();
      
      // Get current user (optional - fall back to public templates if no auth)
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('templates')
        .select('*');
      
      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }
      
      if (language) {
        query = query.eq('language', language);
      }
      
      if (user_only && user) {
        query = query.eq('user_id', user.id);
      } else if (!user_only) {
        // Include public templates and user's private templates if authenticated
        if (user) {
          query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
        } else {
          query = query.eq('is_public', true);
        }
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data: templates, error } = await query;
      
      if (error) {
        console.error('Supabase templates query error:', error);
        throw error;
      }
      
      return NextResponse.json({
        templates: templates || [],
        source: 'supabase',
        total: templates?.length || 0
      });
      
    } catch (supabaseError) {
      console.warn('Supabase unavailable, using fallback templates:', supabaseError);
      
      // Filter fallback templates based on parameters
      let filteredTemplates = FALLBACK_TEMPLATES;
      
      if (category) {
        filteredTemplates = filteredTemplates.filter(t => t.category === category);
      }
      
      if (language) {
        filteredTemplates = filteredTemplates.filter(t => t.language === language);
      }
      
      // For fallback, user_only doesn't apply since we don't have user context
      
      return NextResponse.json({
        templates: filteredTemplates,
        source: 'fallback',
        total: filteredTemplates.length,
        warning: 'Using fallback templates - Supabase unavailable'
      });
    }
    
  } catch (error) {
    console.error('Templates GET error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const templateData = CreateTemplateSchema.parse(body);
    
    // Try Supabase first
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required to create templates' },
          { status: 401 }
        );
      }
      
      const { data: template, error } = await supabase
        .from('templates')
        .insert([{
          ...templateData,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase template creation error:', error);
        throw error;
      }
      
      return NextResponse.json({
        template,
        source: 'supabase'
      }, { status: 201 });
      
    } catch (supabaseError) {
      console.warn('Supabase unavailable for template creation:', supabaseError);
      
      // Return graceful degradation message
      return NextResponse.json({
        error: 'Template storage unavailable',
        message: 'Templates cannot be saved at the moment. Please try again later.',
        fallback_available: true,
        suggested_action: 'Use existing templates or retry later'
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('Templates POST error:', error);
    
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

// PUT: Update template
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const updateData = UpdateTemplateSchema.parse(body);
    
    // Try Supabase first
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required to update templates' },
          { status: 401 }
        );
      }
      
      const { data: template, error } = await supabase
        .from('templates')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('user_id', user.id) // Ensure user can only update their own templates
        .select()
        .single();
      
      if (error) {
        console.error('Supabase template update error:', error);
        
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Template not found or access denied' },
            { status: 404 }
          );
        }
        
        throw error;
      }
      
      return NextResponse.json({
        template,
        source: 'supabase'
      });
      
    } catch (supabaseError) {
      console.warn('Supabase unavailable for template update:', supabaseError);
      
      return NextResponse.json({
        error: 'Template storage unavailable',
        message: 'Templates cannot be updated at the moment. Please try again later.',
        suggested_action: 'Retry later or use fallback templates'
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('Templates PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Try Supabase first
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required to delete templates' },
          { status: 401 }
        );
      }
      
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id); // Ensure user can only delete their own templates
      
      if (error) {
        console.error('Supabase template deletion error:', error);
        throw error;
      }
      
      return NextResponse.json({
        message: 'Template deleted successfully',
        source: 'supabase'
      });
      
    } catch (supabaseError) {
      console.warn('Supabase unavailable for template deletion:', supabaseError);
      
      return NextResponse.json({
        error: 'Template storage unavailable',
        message: 'Templates cannot be deleted at the moment. Please try again later.',
        suggested_action: 'Retry later'
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('Templates DELETE error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
