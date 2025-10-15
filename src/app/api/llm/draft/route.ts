import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const DraftSchema = z.object({
  intent: z.string(),
  transcriptOrText: z.string(),
  extraction: z.object({
    ask: z.string(),
    people: z.array(z.any()).optional(),
    dates_times: z.array(z.any()).optional(),
    sentiment: z.string().optional(),
    urgency: z.string().optional(),
    topics: z.array(z.string()).optional()
  }),
  slots: z.array(z.object({
    start: z.string(),
    end: z.string()
  })).optional(),
  userProfile: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    signature: z.string().optional(),
    tone: z.string().optional(),
    language: z.string().optional()
  }).optional(),
  contactProfile: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    relationship: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      intent,
      transcriptOrText,
      extraction,
      slots = [],
      userProfile = {},
      contactProfile = {}
    } = DraftSchema.parse(body);

    // Build context-aware prompt based on intent
    const prompt = buildDraftPrompt(
      intent,
      transcriptOrText,
      extraction,
      slots,
      userProfile,
      contactProfile
    );

    // Call OpenAI GPT-4 Turbo
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email writer. Create professional, contextual emails based on user intent and extracted information. Always maintain the requested tone and include relevant details.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI Draft Error:', errorData);
      
      return NextResponse.json(
        { error: `Draft generation failed: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const openaiData = await response.json();
    const duration = Date.now() - startTime;

    const generatedText = openaiData.choices?.[0]?.message?.content || '';
    
    // Generate alternative versions
    const alternatives = await generateAlternatives(
      apiKey,
      prompt,
      generatedText,
      userProfile?.tone || 'professional'
    );

    // Parse and structure the email
    const emailParts = parseEmailContent(generatedText);
    
    const result = {
      primary_draft: {
        subject: emailParts.subject,
        body: emailParts.body,
        signature: userProfile?.signature || emailParts.signature,
        tone: userProfile?.tone || 'professional',
        confidence: calculateConfidence(extraction, slots.length),
        word_count: generatedText.split(' ').length
      },
      alternatives: alternatives.slice(0, 2), // Top 2 alternatives
      metadata: {
        intent,
        model_used: 'gpt-4-turbo-preview',
        duration_ms: duration,
        tokens_used: openaiData.usage?.total_tokens || 0,
        language: userProfile?.language || extraction.language || 'en',
        urgency: extraction.urgency || 'medium'
      },
      suggested_actions: generateSuggestedActions(intent, extraction, slots.length > 0)
    };

    // Log metrics (without sensitive content)
    try {
      console.log('Draft generation completed', {
        intent,
        confidence: result.primary_draft.confidence,
        word_count: result.primary_draft.word_count,
        alternatives_count: alternatives.length,
        duration_ms: duration,
        tokens_used: result.metadata.tokens_used,
        success: true
      });
    } catch (logError) {
      console.warn('Failed to log draft metrics:', logError);
    }

    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('Draft generation error:', error);
    
    // Log error metrics
    try {
      console.log('Draft generation failed', {
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } catch (logError) {
      console.warn('Failed to log error metrics:', logError);
    }

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

// Build context-aware prompt based on intent and extracted information
function buildDraftPrompt(
  intent: string,
  text: string,
  extraction: any,
  slots: Array<{ start: string; end: string }>,
  userProfile: any,
  contactProfile: any
): string {
  const tone = userProfile?.tone || 'professional';
  const language = userProfile?.language || extraction.language || 'en';
  
  let prompt = `Write a ${tone} email in ${language} based on this request:\n\n`;
  prompt += `Original request: "${text}"\n\n`;
  prompt += `Intent: ${intent}\n`;
  prompt += `What user wants: ${extraction.ask}\n`;
  
  if (extraction.people?.length > 0) {
    prompt += `People involved: ${extraction.people.map((p: any) => p.name || p.email).join(', ')}\n`;
  }
  
  if (extraction.topics?.length > 0) {
    prompt += `Topics: ${extraction.topics.join(', ')}\n`;
  }
  
  if (slots.length > 0) {
    prompt += `Suggested meeting times:\n`;
    slots.forEach((slot, i) => {
      const start = new Date(slot.start).toLocaleString();
      const end = new Date(slot.end).toLocaleString();
      prompt += `${i + 1}. ${start} - ${end}\n`;
    });
  }
  
  if (contactProfile?.name) {
    prompt += `Recipient: ${contactProfile.name}`;
    if (contactProfile.relationship) {
      prompt += ` (${contactProfile.relationship})`;
    }
    prompt += `\n`;
  }
  
  prompt += `\nCreate a complete email with subject line and body. `;
  
  switch (intent) {
    case 'reply':
      prompt += `This is a reply, so reference the original context appropriately.`;
      break;
    case 'calendar':
      prompt += `Focus on scheduling and include the suggested times clearly.`;
      break;
    case 'summarize':
      prompt += `Provide a clear, concise summary with key points.`;
      break;
    default:
      prompt += `Make it relevant to the user's request.`;
  }
  
  if (userProfile?.signature) {
    prompt += `\n\nInclude this signature: ${userProfile.signature}`;
  }
  
  return prompt;
}

// Generate alternative versions with different tones
async function generateAlternatives(
  apiKey: string,
  originalPrompt: string,
  primaryDraft: string,
  currentTone: string
): Promise<Array<{ subject: string; body: string; tone: string; confidence: number }>> {
  const alternativeTones = ['casual', 'formal', 'friendly'].filter(tone => tone !== currentTone);
  const alternatives = [];
  
  for (const tone of alternativeTones.slice(0, 2)) { // Generate max 2 alternatives
    try {
      const altPrompt = originalPrompt.replace(currentTone, tone) + `\n\nMake this ${tone} in style.`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `Create a ${tone} alternative to the given email.`
            },
            {
              role: 'user',
              content: altPrompt
            }
          ],
          max_tokens: 800,
          temperature: 0.8
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const altText = data.choices?.[0]?.message?.content || '';
        const altParts = parseEmailContent(altText);
        
        alternatives.push({
          subject: altParts.subject,
          body: altParts.body,
          tone,
          confidence: 0.8
        });
      }
    } catch (error) {
      console.warn(`Failed to generate ${tone} alternative:`, error);
    }
  }
  
  return alternatives;
}

// Parse email content into structured parts
function parseEmailContent(content: string) {
  const lines = content.split('\n').filter(line => line.trim());
  
  let subject = '';
  let body = '';
  let signature = '';
  
  // Look for subject line
  const subjectLine = lines.find(line => 
    line.toLowerCase().startsWith('subject:') || 
    line.toLowerCase().startsWith('re:') ||
    line.toLowerCase().startsWith('fw:')
  );
  
  if (subjectLine) {
    subject = subjectLine.replace(/^(subject:|re:|fw:)\s*/i, '').trim();
  } else if (lines.length > 0) {
    // Use first line as subject if no explicit subject found
    subject = lines[0];
  }
  
  // Extract body (everything except subject and signature)
  const bodyLines = lines.filter(line => 
    line !== subjectLine &&
    !line.toLowerCase().startsWith('best regards') &&
    !line.toLowerCase().startsWith('sincerely') &&
    !line.toLowerCase().includes('signature')
  );
  
  body = bodyLines.join('\n').trim();
  
  // Look for signature patterns
  const signatureMarkers = ['best regards', 'sincerely', 'thank you', 'thanks'];
  const signatureStart = lines.findIndex(line => 
    signatureMarkers.some(marker => line.toLowerCase().includes(marker))
  );
  
  if (signatureStart !== -1) {
    signature = lines.slice(signatureStart).join('\n');
  }
  
  return { subject, body, signature };
}

// Calculate confidence score based on available context
function calculateConfidence(extraction: any, hasSlots: boolean): number {
  let confidence = 0.5; // Base confidence
  
  if (extraction.ask && extraction.ask.length > 10) confidence += 0.1;
  if (extraction.people?.length > 0) confidence += 0.1;
  if (extraction.dates_times?.length > 0) confidence += 0.1;
  if (extraction.topics?.length > 0) confidence += 0.1;
  if (hasSlots) confidence += 0.2;
  if (extraction.sentiment === 'positive') confidence += 0.05;
  if (extraction.urgency === 'high') confidence += 0.05;
  
  return Math.min(confidence, 0.95); // Cap at 95%
}

// Generate suggested follow-up actions
function generateSuggestedActions(intent: string, extraction: any, hasCalendarSlots: boolean) {
  const actions = ['send', 'edit'];
  
  if (hasCalendarSlots) {
    actions.push('add_to_calendar');
  }
  
  if (extraction.topics?.length > 0 || extraction.ask?.length > 50) {
    actions.push('save_template');
  }
  
  if (intent === 'reply' && extraction.language !== 'en') {
    actions.push('translate');
  }
  
  if (extraction.urgency === 'high') {
    actions.unshift('send_immediately');
  }
  
  return actions;
}
