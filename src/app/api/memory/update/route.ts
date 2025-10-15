import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import config from '@/lib/config';

// Input validation schema
const MemoryUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  updateType: z.enum(['contact_trust', 'tone_preference', 'time_windows', 'language_preference', 'signature_update', 'template_usage']),
  data: z.object({
    // Contact trust updates
    contactEmail: z.string().email().optional(),
    trustLevel: z.number().min(0).max(100).optional(),
    trustReason: z.string().optional(),
    
    // Tone preferences
    defaultTone: z.enum(['professional', 'casual', 'formal', 'friendly', 'concise']).optional(),
    contactToneOverride: z.object({
      email: z.string().email(),
      tone: z.enum(['professional', 'casual', 'formal', 'friendly', 'concise'])
    }).optional(),
    
    // Time preferences
    timeWindows: z.array(z.object({
      day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
      preference: z.enum(['high', 'medium', 'low'])
    })).optional(),
    
    // Language preferences
    primaryLanguage: z.string().min(2).max(5).optional(),
    secondaryLanguages: z.array(z.string().min(2).max(5)).optional(),
    
    // Signature updates
    signatureHtml: z.string().optional(),
    includeSignature: z.boolean().optional(),
    
    // Template usage tracking
    templateId: z.string().optional(),
    usageContext: z.string().optional(),
    effectiveness: z.enum(['high', 'medium', 'low']).optional()
  }),
  confidence: z.number().min(0).max(1).default(0.7),
  source: z.enum(['user_explicit', 'user_implicit', 'ai_inference']).default('user_explicit')
});

async function memoryUpdateHandler(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate Supabase configuration
    if (!config.services.supabase) {
      return NextResponse.json(
        { error: 'Memory system not configured - Supabase connection missing' },
        { status: 500 }
      );
    }

    const supabaseUrl = config.config.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = config.config.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const updateRequest = MemoryUpdateSchema.parse(body);

    const { userId, updateType, data, confidence, source } = updateRequest;

    let result;
    
    switch (updateType) {
      case 'contact_trust':
        result = await updateContactTrust(supabase, userId, data);
        break;
      case 'tone_preference':
        result = await updateTonePreference(supabase, userId, data);
        break;
      case 'time_windows':
        result = await updateTimeWindows(supabase, userId, data);
        break;
      case 'language_preference':
        result = await updateLanguagePreference(supabase, userId, data);
        break;
      case 'signature_update':
        result = await updateSignature(supabase, userId, data);
        break;
      case 'template_usage':
        result = await trackTemplateUsage(supabase, userId, data);
        break;
      default:
        throw new Error(`Unsupported update type: ${updateType}`);
    }

    // Log the memory update
    await logMemoryUpdate(supabase, {
      userId,
      updateType,
      confidence,
      source,
      success: true,
      details: result
    });

    const requestDuration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      updateType,
      result,
      metadata: {
        userId,
        confidence,
        source,
        processingTimeMs: requestDuration,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const requestDuration = Date.now() - startTime;
    
    console.error('Memory update error:', error);

    // Log error
    if (config.services.supabase) {
      try {
        const supabase = createClient(
          config.config.NEXT_PUBLIC_SUPABASE_URL!,
          config.config.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        await logMemoryUpdate(supabase, {
          updateType: (await request.json()).updateType || 'unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTimeMs: requestDuration
        });
      } catch (logError) {
        console.warn('Failed to log memory update error:', logError);
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid memory update request', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error - failed to update memory' },
      { status: 500 }
    );
  }
}

// Update contact trust level
async function updateContactTrust(supabase: any, userId: string, data: any) {
  const { contactEmail, trustLevel, trustReason } = data;
  
  if (!contactEmail || trustLevel === undefined) {
    throw new Error('Contact email and trust level are required');
  }

  const { data: result, error } = await supabase
    .from('contacts_profile')
    .upsert({
      user_id: userId,
      contact_email: contactEmail,
      trust_level: trustLevel,
      trust_reason: trustReason,
      last_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id,contact_email' 
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to update contact trust: ${error.message}`);
  
  return {
    contactEmail,
    previousTrustLevel: result.trust_level,
    newTrustLevel: trustLevel,
    reason: trustReason
  };
}

// Update tone preferences
async function updateTonePreference(supabase: any, userId: string, data: any) {
  const { defaultTone, contactToneOverride } = data;

  const updates: any[] = [];

  // Update default tone in user profile
  if (defaultTone) {
    const { error: profileError } = await supabase
      .from('user_profile')
      .upsert({
        id: userId,
        default_tone: defaultTone,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) throw new Error(`Failed to update default tone: ${profileError.message}`);
    updates.push({ type: 'default_tone', value: defaultTone });
  }

  // Update contact-specific tone override
  if (contactToneOverride) {
    const { error: contactError } = await supabase
      .from('contacts_profile')
      .upsert({
        user_id: userId,
        contact_email: contactToneOverride.email,
        tone_override: contactToneOverride.tone,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,contact_email' });

    if (contactError) throw new Error(`Failed to update contact tone: ${contactError.message}`);
    updates.push({ type: 'contact_tone_override', contact: contactToneOverride.email, value: contactToneOverride.tone });
  }

  return { updates };
}

// Update time window preferences
async function updateTimeWindows(supabase: any, userId: string, data: any) {
  const { timeWindows } = data;
  
  if (!timeWindows || !Array.isArray(timeWindows)) {
    throw new Error('Time windows array is required');
  }

  const { error } = await supabase
    .from('user_profile')
    .upsert({
      id: userId,
      time_windows: timeWindows,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) throw new Error(`Failed to update time windows: ${error.message}`);

  return { 
    timeWindowsCount: timeWindows.length,
    preferences: timeWindows.map((tw: any) => ({
      day: tw.day,
      window: `${tw.startTime}-${tw.endTime}`,
      preference: tw.preference
    }))
  };
}

// Update language preferences
async function updateLanguagePreference(supabase: any, userId: string, data: any) {
  const { primaryLanguage, secondaryLanguages } = data;

  const updates: any = {};
  if (primaryLanguage) updates.primary_language = primaryLanguage;
  if (secondaryLanguages) updates.secondary_languages = secondaryLanguages;

  if (Object.keys(updates).length === 0) {
    throw new Error('No language preferences provided');
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('user_profile')
    .upsert({
      id: userId,
      ...updates
    }, { onConflict: 'id' });

  if (error) throw new Error(`Failed to update language preferences: ${error.message}`);

  return {
    primaryLanguage,
    secondaryLanguages: secondaryLanguages || [],
    updatedFields: Object.keys(updates).filter(key => key !== 'updated_at')
  };
}

// Update email signature
async function updateSignature(supabase: any, userId: string, data: any) {
  const { signatureHtml, includeSignature } = data;

  const updates: any = {};
  if (signatureHtml !== undefined) updates.signature_html = signatureHtml;
  if (includeSignature !== undefined) updates.include_signature = includeSignature;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('user_profile')
    .upsert({
      id: userId,
      ...updates
    }, { onConflict: 'id' });

  if (error) throw new Error(`Failed to update signature: ${error.message}`);

  return {
    signatureUpdated: signatureHtml !== undefined,
    includeSignatureUpdated: includeSignature !== undefined,
    signatureLength: signatureHtml ? signatureHtml.length : 0
  };
}

// Track template usage for learning
async function trackTemplateUsage(supabase: any, userId: string, data: any) {
  const { templateId, usageContext, effectiveness } = data;

  if (!templateId) {
    throw new Error('Template ID is required for usage tracking');
  }

  // Update template usage count
  const { error: templateError } = await supabase
    .from('templates')
    .update({
      usage_count: supabase.rpc('increment_usage_count'),
      last_used_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (templateError) throw new Error(`Failed to update template usage: ${templateError.message}`);

  // Log usage event
  const { error: logError } = await supabase
    .from('events_log')
    .insert({
      user_id: userId,
      action: 'template_usage',
      component: 'template_system',
      details: JSON.stringify({
        templateId,
        usageContext,
        effectiveness
      }),
      success: true,
      created_at: new Date().toISOString()
    });

  if (logError) console.warn('Failed to log template usage:', logError);

  return {
    templateId,
    usageContext,
    effectiveness,
    tracked: true
  };
}

// Log memory update for analytics
async function logMemoryUpdate(supabase: any, logData: any) {
  try {
    await supabase
      .from('events_log')
      .insert({
        user_id: logData.userId || null,
        action: 'memory_update',
        component: 'memory_system',
        details: JSON.stringify({
          updateType: logData.updateType,
          confidence: logData.confidence,
          source: logData.source,
          result: logData.result,
          error: logData.error,
          processingTimeMs: logData.processingTimeMs
        }),
        success: logData.success,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.warn('Failed to log memory update:', error);
  }
}

// Export with rate limiting
export const POST = withRateLimit(rateLimitConfigs.general)(memoryUpdateHandler);
