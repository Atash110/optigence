import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TemplateAnalysisRequest {
  subject: string;
  body: string;
  recipients: string[];
  intent: string;
  userId: string;
}

interface PatternDetection {
  pattern_type: 'subject' | 'body' | 'recipients' | 'intent';
  pattern: string;
  frequency: number;
  confidence: number;
  examples: string[];
}

// Store email history for pattern analysis (in production, use a database)
const emailHistory = new Map<string, Array<{
  subject: string;
  body: string;
  recipients: string[];
  intent: string;
  timestamp: number;
}>>();

export async function POST(request: NextRequest) {
  try {
    const { subject, body, recipients, intent, userId }: TemplateAnalysisRequest = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Store current email in history
    if (!emailHistory.has(userId)) {
      emailHistory.set(userId, []);
    }

    const userHistory = emailHistory.get(userId)!;
    userHistory.push({
      subject,
      body,
      recipients,
      intent,
      timestamp: Date.now()
    });

    // Keep only recent history (last 50 emails)
    if (userHistory.length > 50) {
      emailHistory.set(userId, userHistory.slice(-50));
    }

    // Analyze patterns in user's email history
    const patterns = await analyzePatterns(userHistory);

    return NextResponse.json({
      patterns,
      suggestion: patterns.length > 0 ? {
        shouldCreateTemplate: patterns.some(p => p.frequency >= 3 && p.confidence > 0.7),
        suggestedName: generateTemplateName(subject, intent),
        topicTags: extractTopicTags(body)
      } : null
    });

  } catch (error) {
    console.error('Template analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze patterns' },
      { status: 500 }
    );
  }
}

async function analyzePatterns(
  userHistory: Array<{
    subject: string;
    body: string;
    recipients: string[];
    intent: string;
    timestamp: number;
  }>
): Promise<PatternDetection[]> {
  const patterns: PatternDetection[] = [];

  if (userHistory.length < 3) {
    return patterns; // Need at least 3 emails to detect patterns
  }

  // Analyze subject patterns
  const subjectPatterns = analyzeSubjectPatterns(userHistory);
  patterns.push(...subjectPatterns);

  // Analyze intent patterns
  const intentPatterns = analyzeIntentPatterns(userHistory);
  patterns.push(...intentPatterns);

  // Analyze recipient patterns
  const recipientPatterns = analyzeRecipientPatterns(userHistory);
  patterns.push(...recipientPatterns);

  // Analyze body structure patterns
  const bodyPatterns = await analyzeBodyPatterns(userHistory);
  patterns.push(...bodyPatterns);

  return patterns.filter(p => p.frequency >= 2 && p.confidence > 0.5);
}

function analyzeSubjectPatterns(
  userHistory: Array<{
    subject: string;
    body: string;
    recipients: string[];
    intent: string;
    timestamp: number;
  }>
): PatternDetection[] {
  const subjectGroups = new Map<string, string[]>();

  userHistory.forEach(email => {
    // Normalize subject by removing dates, numbers, names
    const normalizedSubject = email.subject
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g, '[DATE]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
      .replace(/\b\d+\b/g, '[NUMBER]')
      .toLowerCase()
      .trim();

    if (!subjectGroups.has(normalizedSubject)) {
      subjectGroups.set(normalizedSubject, []);
    }
    subjectGroups.get(normalizedSubject)!.push(email.subject);
  });

  return Array.from(subjectGroups.entries())
    .filter(([, examples]) => examples.length >= 2)
    .map(([pattern, examples]) => ({
      pattern_type: 'subject' as const,
      pattern,
      frequency: examples.length,
      confidence: Math.min(0.9, examples.length / userHistory.length + 0.3),
      examples: examples.slice(0, 3)
    }));
}

function analyzeIntentPatterns(
  userHistory: Array<{
    subject: string;
    body: string;
    recipients: string[];
    intent: string;
    timestamp: number;
  }>
): PatternDetection[] {
  const intentCounts = new Map<string, number>();
  const intentExamples = new Map<string, string[]>();

  userHistory.forEach(email => {
    const count = intentCounts.get(email.intent) || 0;
    intentCounts.set(email.intent, count + 1);

    if (!intentExamples.has(email.intent)) {
      intentExamples.set(email.intent, []);
    }
    if (intentExamples.get(email.intent)!.length < 3) {
      intentExamples.get(email.intent)!.push(email.subject);
    }
  });

  return Array.from(intentCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([intent, count]) => ({
      pattern_type: 'intent' as const,
      pattern: intent,
      frequency: count,
      confidence: Math.min(0.9, count / userHistory.length + 0.2),
      examples: intentExamples.get(intent) || []
    }));
}

function analyzeRecipientPatterns(
  userHistory: Array<{
    subject: string;
    body: string;
    recipients: string[];
    intent: string;
    timestamp: number;
  }>
): PatternDetection[] {
  const recipientCounts = new Map<string, number>();
  const recipientExamples = new Map<string, string[]>();

  userHistory.forEach(email => {
    email.recipients.forEach(recipient => {
      const count = recipientCounts.get(recipient) || 0;
      recipientCounts.set(recipient, count + 1);

      if (!recipientExamples.has(recipient)) {
        recipientExamples.set(recipient, []);
      }
      if (recipientExamples.get(recipient)!.length < 3) {
        recipientExamples.get(recipient)!.push(email.subject);
      }
    });
  });

  return Array.from(recipientCounts.entries())
    .filter(([, count]) => count >= 3)
    .map(([recipient, count]) => ({
      pattern_type: 'recipients' as const,
      pattern: recipient,
      frequency: count,
      confidence: Math.min(0.9, count / userHistory.length + 0.3),
      examples: recipientExamples.get(recipient) || []
    }));
}

async function analyzeBodyPatterns(
  userHistory: Array<{
    subject: string;
    body: string;
    recipients: string[];
    intent: string;
    timestamp: number;
  }>
): Promise<PatternDetection[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }

  try {
    // Group emails by similar structure
    const bodyTexts = userHistory.map(email => email.body).slice(-10); // Analyze last 10 emails

    if (bodyTexts.length < 3) {
      return [];
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze these email bodies for structural patterns. Find repeated phrases, greetings, closings, or formatting that appears in multiple emails. Return patterns that appear at least 2 times.'
        },
        {
          role: 'user',
          content: `Emails to analyze:\n\n${bodyTexts.map((body, i) => `${i + 1}. ${body.substring(0, 200)}...`).join('\n\n')}`
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const analysisResult = response.choices[0]?.message?.content;

    if (!analysisResult) {
      return [];
    }

    // Parse the analysis result and create pattern objects
    const patterns: PatternDetection[] = [];

    // Simple pattern extraction (in production, use more sophisticated parsing)
    const lines = analysisResult.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('appears') && line.includes('times')) {
        const match = line.match(/(\d+) times/);
        if (match) {
          const frequency = parseInt(match[1]);
          if (frequency >= 2) {
            patterns.push({
              pattern_type: 'body',
              pattern: line.replace(/appears \d+ times/g, '').trim(),
              frequency,
              confidence: Math.min(0.8, frequency / bodyTexts.length + 0.2),
              examples: []
            });
          }
        }
      }
    });

    return patterns;

  } catch (error) {
    console.error('Body pattern analysis error:', error);
    return [];
  }
}

function generateTemplateName(subject: string, intent: string): string {
  // Generate a descriptive template name
  const subjectWords = subject.split(' ').slice(0, 3).join(' ');
  const intentCapitalized = intent.charAt(0).toUpperCase() + intent.slice(1);
  
  return `${intentCapitalized} - ${subjectWords}`;
}

function extractTopicTags(body: string): string[] {
  const tags: string[] = [];
  
  // Extract common business terms
  const businessTerms = [
    'meeting', 'project', 'deadline', 'review', 'update', 'report',
    'budget', 'schedule', 'team', 'client', 'proposal', 'contract'
  ];
  
  const bodyLower = body.toLowerCase();
  businessTerms.forEach(term => {
    if (bodyLower.includes(term)) {
      tags.push(term);
    }
  });
  
  return tags.slice(0, 5); // Return max 5 tags
}
