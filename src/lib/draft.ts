// Email drafting engine with GPT-4 Turbo integration
import { openai } from '@/lib/openai';

interface UserMemory {
  signature?: string;
  tone: 'professional' | 'casual' | 'friendly' | 'formal';
  language: string;
  timezone?: string;
  name?: string;
}

interface DraftingContext {
  threadSummary?: string;
  constraints: string[];
  userMemory: UserMemory;
  intent: string;
  entities: {
    attendees: string[];
    dates: string[];
    places: string[];
  };
}

interface EmailDraft {
  subject: string;
  body: string;
  confidence: number;
  reasoning: string;
}

interface DraftResult {
  primary: EmailDraft;
  alternatives: EmailDraft[];
  processingTime: number;
}

const OPTIMAIL_SYSTEM_PROMPT = `You are OptiMail, a hyper-agentive email assistant. 

PERSONALITY: Short, decisive, kind. Never verbose. Always helpful. 

OUTPUT RULES:
- Subject: ≤8 words, action-focused
- Body: 80-150 words max
- Tone: Match user's preference exactly
- Structure: Greeting + Purpose + Action/Next Steps + Sign-off
- Strip all quoted email tails and signatures from context
- Use user's signature if provided
- Apply user's language preference
- Be contextually aware but concise

TONE GUIDELINES:
- Professional: Formal but warm, complete sentences
- Casual: Relaxed, contractions OK, friendly
- Friendly: Warm, personal, enthusiastic but appropriate  
- Formal: Traditional business language, no contractions

RESPONSE FORMAT:
Return JSON only with this structure:
{
  "subject": "Concise subject line",
  "body": "Complete email body with proper greeting and sign-off",
  "confidence": 0.85,
  "reasoning": "Why this approach works"
}`;

// Strip quoted content and signatures from email threads
function cleanEmailContent(content: string): string {
  // Remove quoted content (starts with > or lines like "On [date], [person] wrote:")
  const lines = content.split('\n');
  const cleanLines: string[] = [];
  let inQuotedSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip quoted lines
    if (trimmed.startsWith('>') || trimmed.startsWith('&gt;')) {
      inQuotedSection = true;
      continue;
    }
    
    // Skip common email thread indicators
    if (/^On .* wrote:$/i.test(trimmed) || 
        /^From:.*$/i.test(trimmed) ||
        /^Sent:.*$/i.test(trimmed) ||
        /^To:.*$/i.test(trimmed)) {
      inQuotedSection = true;
      continue;
    }
    
    // Skip signature blocks (common patterns)
    if (trimmed === '--' || 
        /^Best regards?[,.]?$/i.test(trimmed) ||
        /^Sincerely[,.]?$/i.test(trimmed) ||
        /^Thanks?[,.]?$/i.test(trimmed)) {
      break;
    }
    
    // Reset quoted section on empty line
    if (trimmed === '') {
      inQuotedSection = false;
    }
    
    if (!inQuotedSection) {
      cleanLines.push(line);
    }
  }
  
  return cleanLines.join('\n').trim();
}

// Generate user signature based on memory
function buildUserSignature(userMemory: UserMemory): string {
  if (userMemory.signature) {
    return userMemory.signature;
  }
  
  // Generate appropriate sign-off based on tone
  switch (userMemory.tone) {
    case 'professional':
      return 'Best regards';
    case 'casual':
      return 'Thanks!';
    case 'friendly':
      return 'Best';
    case 'formal':
      return 'Sincerely';
    default:
      return 'Best regards';
  }
}

async function generateDraftWithGPT4(context: DraftingContext): Promise<EmailDraft> {
  try {
    // Prepare the context prompt
    const contextPrompt = `
CONTEXT:
- Intent: ${context.intent}
- Thread Summary: ${context.threadSummary || 'New email'}
- Constraints: ${context.constraints.join(', ')}
- Attendees: ${context.entities.attendees.join(', ')}
- Dates: ${context.entities.dates.join(', ')}
- Places: ${context.entities.places.join(', ')}

USER PREFERENCES:
- Tone: ${context.userMemory.tone}
- Language: ${context.userMemory.language}
- Signature: ${context.userMemory.signature || 'Use appropriate sign-off'}

Generate a ${context.userMemory.tone} email that addresses the intent clearly and concisely.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: OPTIMAIL_SYSTEM_PROMPT },
        { role: 'user', content: contextPrompt }
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from GPT-4');

    const parsed = JSON.parse(content);

    // Clean the body content
    let cleanBody = cleanEmailContent(parsed.body);
    
    // Ensure proper signature
    const signature = buildUserSignature(context.userMemory);
    if (!cleanBody.includes(signature)) {
      cleanBody += `\n\n${signature}`;
    }
    
    // Add user name if available
    if (context.userMemory.name && !cleanBody.includes(context.userMemory.name)) {
      cleanBody = cleanBody.replace(signature, `${signature}\n${context.userMemory.name}`);
    }

    return {
      subject: parsed.subject || 'Quick follow-up',
      body: cleanBody,
      confidence: Math.min(0.98, parsed.confidence || 0.85),
      reasoning: parsed.reasoning || 'Generated with GPT-4 Turbo'
    };

  } catch (error) {
    console.error('GPT-4 drafting error:', error);
    
    // Fallback to simple template
    return {
      subject: 'Quick follow-up',
      body: `Hi,\n\nI wanted to follow up on our discussion. Please let me know if you have any questions.\n\n${buildUserSignature(context.userMemory)}`,
      confidence: 0.4,
      reasoning: 'Fallback template due to API error'
    };
  }
}

async function generateAlternatives(primaryDraft: EmailDraft): Promise<EmailDraft[]> {
  const alternatives: EmailDraft[] = [];
  
  try {
    // Generate brief version
    const briefResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: OPTIMAIL_SYSTEM_PROMPT + '\n\nMake this version VERY brief - under 50 words total.' 
        },
        { 
          role: 'user', 
          content: `Create a brief version of this email:\n\nSubject: ${primaryDraft.subject}\nBody: ${primaryDraft.body}` 
        }
      ],
      max_tokens: 200,
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const briefContent = briefResponse.choices[0]?.message?.content;
    if (briefContent) {
      const briefParsed = JSON.parse(briefContent);
      alternatives.push({
        subject: briefParsed.subject,
        body: briefParsed.body,
        confidence: 0.75,
        reasoning: 'Brief version for quick communication'
      });
    }

    // Generate detailed version
    const detailedResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: [
        { 
          role: 'system', 
          content: OPTIMAIL_SYSTEM_PROMPT + '\n\nMake this version more detailed but still under 200 words.' 
        },
        { 
          role: 'user', 
          content: `Create a detailed version of this email:\n\nSubject: ${primaryDraft.subject}\nBody: ${primaryDraft.body}` 
        }
      ],
      max_tokens: 400,
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const detailedContent = detailedResponse.choices[0]?.message?.content;
    if (detailedContent) {
      const detailedParsed = JSON.parse(detailedContent);
      alternatives.push({
        subject: detailedParsed.subject,
        body: detailedParsed.body,
        confidence: 0.80,
        reasoning: 'Detailed version with more context'
      });
    }

  } catch (error) {
    console.error('Alternative generation error:', error);
  }

  return alternatives;
}

export async function draftEmail(context: DraftingContext): Promise<DraftResult> {
  const startTime = Date.now();
  
  // Generate primary draft with GPT-4 Turbo
  const primaryDraft = await generateDraftWithGPT4(context);
  
  // Generate alternatives in parallel
  const alternatives = await generateAlternatives(primaryDraft);
  
  const processingTime = Date.now() - startTime;
  
  return {
    primary: primaryDraft,
    alternatives,
    processingTime
  };
}

// Helper function for quick drafting with minimal context
export async function quickDraft(
  input: string,
  tone: UserMemory['tone'] = 'professional',
  language: string = 'en'
): Promise<EmailDraft> {
  const context: DraftingContext = {
    constraints: [],
    userMemory: { tone, language },
    intent: 'compose',
    entities: { attendees: [], dates: [], places: [] }
  };
  
  const result = await generateDraftWithGPT4(context);
  return result;
}
