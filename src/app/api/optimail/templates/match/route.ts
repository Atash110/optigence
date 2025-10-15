import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TemplateMatchRequest {
  subject: string;
  body: string;
  recipients: string[];
  intent: string;
  userId: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject_pattern: string;
  body_template: string;
  intent: string;
  recipients: string[];
  topic_tags: string[];
  usage_count: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface TemplateMatch {
  template: EmailTemplate;
  match_score: number;
  suggested_modifications: {
    subject?: string;
    body?: string;
    recipients?: string[];
  };
}

// Mock templates storage (use database in production)
const templates = new Map<string, EmailTemplate>();

export async function POST(request: NextRequest) {
  try {
    const { subject, body, recipients, intent, userId }: TemplateMatchRequest = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's templates
    const userTemplates = Array.from(templates.values())
      .filter(template => template.user_id === userId);

    if (userTemplates.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Find matching templates
    const matches: TemplateMatch[] = [];

    for (const template of userTemplates) {
      const matchScore = calculateMatchScore({
        subject,
        body,
        recipients,
        intent
      }, template);

      if (matchScore > 0.3) { // Only include reasonable matches
        const suggestedModifications = await generateSuggestions(
          { subject, body, recipients, intent },
          template
        );

        matches.push({
          template,
          match_score: matchScore,
          suggested_modifications: suggestedModifications
        });
      }
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.match_score - a.match_score);

    // Return top 3 matches
    return NextResponse.json({
      matches: matches.slice(0, 3)
    });

  } catch (error) {
    console.error('Template matching error:', error);
    return NextResponse.json(
      { error: 'Failed to match templates' },
      { status: 500 }
    );
  }
}

function calculateMatchScore(
  current: {
    subject: string;
    body: string;
    recipients: string[];
    intent: string;
  },
  template: EmailTemplate
): number {
  let score = 0;

  // Intent match (40% weight)
  if (current.intent === template.intent) {
    score += 0.4;
  }

  // Subject similarity (25% weight)
  const subjectSimilarity = calculateTextSimilarity(
    normalizeText(current.subject),
    normalizeText(template.subject_pattern)
  );
  score += subjectSimilarity * 0.25;

  // Recipients overlap (20% weight)
  const recipientOverlap = calculateRecipientOverlap(current.recipients, template.recipients);
  score += recipientOverlap * 0.20;

  // Body structure similarity (15% weight)
  const bodySimilarity = calculateTextSimilarity(
    normalizeText(current.body),
    normalizeText(template.body_template)
  );
  score += bodySimilarity * 0.15;

  return Math.min(1, score);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.split(' ').filter(w => w.length > 2);
  const words2 = text2.split(' ').filter(w => w.length > 2);

  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;

  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];

  return intersection.length / union.length;
}

function calculateRecipientOverlap(recipients1: string[], recipients2: string[]): number {
  if (recipients1.length === 0 && recipients2.length === 0) return 1;
  if (recipients1.length === 0 || recipients2.length === 0) return 0;

  const set1 = new Set(recipients1.map(r => r.toLowerCase()));
  const set2 = new Set(recipients2.map(r => r.toLowerCase()));

  const intersection = [...set1].filter(r => set2.has(r));
  const union = new Set([...set1, ...set2]);

  return intersection.length / union.size;
}

async function generateSuggestions(
  current: {
    subject: string;
    body: string;
    recipients: string[];
    intent: string;
  },
  template: EmailTemplate
): Promise<{
  subject?: string;
  body?: string;
  recipients?: string[];
}> {
  const suggestions: {
    subject?: string;
    body?: string;
    recipients?: string[];
  } = {};

  try {
    if (process.env.OPENAI_API_KEY) {
      // Generate subject suggestion based on template
      if (template.subject_pattern && current.subject !== template.subject_pattern) {
        const subjectResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Adapt this email subject template to fit the current context. Replace placeholders with appropriate values based on the current subject.'
            },
            {
              role: 'user',
              content: `Template: "${template.subject_pattern}"\nCurrent subject: "${current.subject}"\nGenerate an improved subject:`
            }
          ],
          max_tokens: 50,
          temperature: 0.3
        });

        const suggestedSubject = subjectResponse.choices[0]?.message?.content?.trim();
        if (suggestedSubject && suggestedSubject !== current.subject) {
          suggestions.subject = suggestedSubject;
        }
      }

      // Generate body suggestion based on template
      if (template.body_template && current.body.length < template.body_template.length * 0.7) {
        const bodyResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Enhance this email body using the template structure. Keep the original intent but improve completeness and professionalism.'
            },
            {
              role: 'user',
              content: `Template structure: "${template.body_template.substring(0, 200)}..."\nCurrent body: "${current.body}"\nGenerate improved body (max 200 words):`
            }
          ],
          max_tokens: 250,
          temperature: 0.4
        });

        const suggestedBody = bodyResponse.choices[0]?.message?.content?.trim();
        if (suggestedBody && suggestedBody.length > current.body.length) {
          suggestions.body = suggestedBody;
        }
      }
    }

    // Suggest recipients based on template
    const missingRecipients = template.recipients.filter(
      tr => !current.recipients.some(cr => cr.toLowerCase() === tr.toLowerCase())
    );

    if (missingRecipients.length > 0) {
      suggestions.recipients = missingRecipients.slice(0, 3); // Suggest up to 3 missing recipients
    }

  } catch (error) {
    console.error('Suggestion generation error:', error);
  }

  return suggestions;
}
