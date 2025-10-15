/**
 * API Route: /api/learning/contacts
 * Manages contact trust scores and relationship intelligence
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
const ContactTrustSchema = z.object({
  email: z.string().email(),
  trustScore: z.number().min(0).max(1),
  communicationFrequency: z.number().int().min(0),
  responseRate: z.number().min(0).max(1),
  relationshipType: z.enum(['colleague', 'client', 'friend', 'manager', 'vendor', 'unknown']),
  lastInteraction: z.string().transform(str => new Date(str)),
  autoSendSuccess: z.number().min(0).max(1)
});

const UpdateContactsSchema = z.object({
  userId: z.string(),
  contacts: z.array(ContactTrustSchema)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get contact intelligence data
    const { data: contacts, error } = await supabase
      .from('contact_intelligence')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Transform database format to API format
    const formattedContacts = (contacts || []).map(contact => ({
      email: contact.contact_email,
      trustScore: contact.trust_score,
      communicationFrequency: contact.communication_history?.frequency || 0,
      responseRate: contact.communication_history?.responseRate || 0,
      relationshipType: contact.relationship_type,
      lastInteraction: contact.last_interaction,
      autoSendSuccess: contact.communication_history?.autoSendSuccess || 0.5
    }));

    return NextResponse.json(formattedContacts);

  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load contact trust data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contacts } = UpdateContactsSchema.parse(body);

    // Update contact intelligence in batch
    const updates = contacts.map(contact => ({
      user_id: userId,
      contact_email: contact.email,
      trust_score: contact.trustScore,
      communication_history: {
        frequency: contact.communicationFrequency,
        responseRate: contact.responseRate,
        autoSendSuccess: contact.autoSendSuccess
      },
      relationship_type: contact.relationshipType,
      last_interaction: contact.lastInteraction.toISOString()
    }));

    const { error } = await supabase
      .from('contact_intelligence')
      .upsert(updates, {
        onConflict: 'user_id,contact_email'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, updated: contacts.length });

  } catch (error) {
    console.error('Contacts PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid contact data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update contact trust data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, interactions } = z.object({
      userId: z.string(),
      email: z.string().email(),
      interactions: z.array(z.object({
        sent: z.number().int().min(0),
        received: z.number().int().min(0),
        responseTime: z.number().min(0),
        sentiment: z.enum(['positive', 'neutral', 'negative'])
      }))
    }).parse(body);

    // Calculate trust metrics
    const totalInteractions = interactions.length;
    const positiveInteractions = interactions.filter(i => i.sentiment === 'positive').length;
    const avgResponseTime = interactions.reduce((sum, i) => sum + i.responseTime, 0) / totalInteractions;
    
    // Calculate trust score (0-1)
    const trustScore = Math.min(1, Math.max(0, 
      (positiveInteractions / totalInteractions) * 0.4 + // 40% from positive sentiment
      (Math.min(avgResponseTime, 86400) / 86400) * 0.3 + // 30% from response speed (max 24h)
      (totalInteractions / 100) * 0.3 // 30% from interaction frequency
    ));

    const responseRate = interactions.filter(i => i.received > 0).length / totalInteractions;

    // Infer relationship type
    let relationshipType: 'colleague' | 'client' | 'friend' | 'manager' | 'vendor' | 'unknown' = 'unknown';
    if (totalInteractions > 50 && trustScore > 0.8) {
      relationshipType = 'colleague';
    } else if (avgResponseTime < 3600 && trustScore > 0.7) {
      relationshipType = 'friend';
    } else if (interactions.some(i => i.sent > i.received * 2)) {
      relationshipType = 'client';
    }

    // Upsert contact intelligence
    const { error } = await supabase
      .from('contact_intelligence')
      .upsert({
        user_id: userId,
        contact_email: email,
        trust_score: trustScore,
        communication_history: {
          frequency: totalInteractions,
          responseRate,
          autoSendSuccess: 0.5, // Default until we have data
          sentiment: interactions.map(i => i.sentiment)
        },
        relationship_type: relationshipType,
        last_interaction: new Date().toISOString()
      }, {
        onConflict: 'user_id,contact_email'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      email,
      trustScore,
      communicationFrequency: totalInteractions,
      responseRate,
      relationshipType,
      lastInteraction: new Date().toISOString(),
      autoSendSuccess: 0.5
    });

  } catch (error) {
    console.error('Contact analysis POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid analysis data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze contact relationship' },
      { status: 500 }
    );
  }
}
