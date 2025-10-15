import { NextRequest, NextResponse } from 'next/server';
import { routeIntent } from '@/lib/optimail/intent-router';
import { AgentRequestBody, AgentResponse, AgentStep, SmartReplyOption, UserPreferences } from '@/types/optimail';
import { buildSignoff, enforceSubject, renderDraft } from '@/lib/optimail/drafting';
import { AI_CONFIGS, openai } from '@/lib/openai';
import { geminiFlash } from '@/lib/gemini-flash';
import { cohereService } from '@/lib/cohere-service';
import { createClient } from '@supabase/supabase-js';

const MODEL_FALLBACK = 'gpt-4o-mini';

interface EmailContext {
  entities: Record<string, unknown>;
  summary: string;
  tone: string;
}

interface ClassificationResult {
  intent: string;
  confidence: number;
  classifications: string[];
}

// Enhanced LLM Router - route to best model for each task
class LLMRouter {
  private static async callOpenAI(prompt: string, systemPrompt: string, maxTokens: number = 500, temperature: number = 0.7) {
    const completion = await openai.chat.completions.create({
      model: AI_CONFIGS.optimail.model || MODEL_FALLBACK,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature,
    });
    return completion.choices[0]?.message?.content || '';
  }

  private static async callGeminiFlash(prompt: string, systemPrompt: string) {
    // Real Gemini Flash implementation
    try {
      if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        const result = await geminiFlash.extractEmailEntities(prompt);
        return JSON.stringify(result);
      } else {
        console.warn('Gemini API key not configured, using OpenAI fallback');
        // Fallback to OpenAI with faster model
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt + ' Be concise and extract only key information.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.3,
        });
        return completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('Gemini Flash error, falling back to OpenAI:', error);
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt + ' Be concise and extract only key information.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });
      return completion.choices[0]?.message?.content || '';
    }
  }

  private static async callCohere(text: string, task: 'classify' | 'generate'): Promise<ClassificationResult | { text: string }> {
    // Real Cohere implementation using Chat API
    try {
      if (process.env.COHERE_API_KEY && task === 'classify') {
        const result = await cohereService.classifyIntent(text);
        return {
          intent: result.intent,
          confidence: result.confidence,
          classifications: result.secondary || []
        };
      } else {
        console.warn('Cohere API key not configured or unsupported task, using local fallback');
        // Use our existing intent router which has good heuristics
        const result = routeIntent(text);
        return {
          intent: result.detected.intent,
          confidence: result.detected.confidence,
          classifications: result.detected.secondary || []
        };
      }
    } catch (error) {
      console.error('Cohere error, falling back to local classification:', error);
      // Fallback to local pattern matching
      const result = routeIntent(text);
      return {
        intent: result.detected.intent,
        confidence: result.detected.confidence,
        classifications: result.detected.secondary || []
      };
    }
    
    return { text: '' };
  }

  static async extractEmailContext(emailText: string): Promise<EmailContext> {
    const systemPrompt = `Extract key entities from this email and provide a concise summary. Return JSON with:
    - entities: {sender, recipient, dates, times, locations, topics, urgency}
    - summary: one sentence summary
    - tone: detected tone (professional/casual/urgent/friendly)`;

    try {
      // Try Gemini Flash first for structured extraction
      if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        const result = await geminiFlash.extractEmailEntities(emailText);
        return {
          entities: result.entities,
          summary: result.summary,
          tone: result.tone
        };
      } else {
        // Fallback to OpenAI
        const response = await this.callGeminiFlash(emailText.slice(0, 4000), systemPrompt);
        const parsed = JSON.parse(response);
        return {
          entities: parsed.entities || {},
          summary: parsed.summary || 'Email content analyzed',
          tone: parsed.tone || 'professional'
        };
      }
    } catch (error) {
      console.error('Entity extraction error:', error);
      return {
        entities: {},
        summary: 'Email content processed',
        tone: 'professional'
      };
    }
  }

  static async generateReply(context: string, userPrefs: Partial<UserPreferences>, emailContext: EmailContext): Promise<string> {
    const systemPrompt = `You are OptiMail. Draft a compact, ready-to-send email reply under strict rules:
Subject: ≤6 words, action-focused.
Lead: 1 short sentence showing context & gratitude.
Purpose: 2–3 compact lines max.
Options: list time slots or choices when relevant.
CTA: single, clear next step.
Sign-off: match user's tone + include signature.
Optional PS: only if truly helpful (1 line).
Length: 80–140 words.
Respect recipient language & tone.

Return ONLY a JSON with keys {"subject","lead","purpose":[...],"options":[...],"cta","signoff","ps"}.`;

    const raw = await this.callOpenAI(
      `Context:\n${emailContext.summary}\n\nReply to:\n${context.slice(0, 3000)}\n\nTone:${userPrefs.tone||'professional'} Language:${userPrefs.language||'en'}`,
      systemPrompt,
      600,
      0.4
    );
    try {
      const parsed = JSON.parse(raw);
      const sign = buildSignoff(userPrefs, userPrefs.tone);
      const { subject, body } = renderDraft({
        subject: enforceSubject(parsed.subject || 'Quick follow-up'),
        lead: parsed.lead || 'Thanks for the update — a quick follow-up.',
        purpose: Array.isArray(parsed.purpose) ? parsed.purpose.slice(0,3) : [String(parsed.purpose||'')].filter(Boolean),
        options: Array.isArray(parsed.options) ? parsed.options.slice(0,4) : undefined,
        cta: parsed.cta || 'Let me know the best next step.',
        signoff: sign,
        ps: parsed.ps?.trim() || undefined,
      }, { language: userPrefs.language, tone: userPrefs.tone, targetWords: { min: 80, max: 140 } });
      return `Subject: ${subject}\n\n${body}`;
    } catch {
      return raw; // fallback as-is
    }
  }

  static async summarizeEmail(emailText: string): Promise<string> {
    const systemPrompt = `Provide a concise summary of this email with:
1. Key points (3-5 bullet points)
2. Action items (if any)
3. One-line TL;DR
Keep it under 150 words total.`;

    return await this.callGeminiFlash(emailText.slice(0, 6000), systemPrompt);
  }

  static async translateAndRewrite(text: string, targetTone: string, targetLanguage: string): Promise<string> {
    const systemPrompt = `Rewrite this text with the following adjustments:
- Tone: ${targetTone}
- Language: ${targetLanguage}
- Maintain the core message but adjust style and formality level
- Make it sound natural and native`;

    return await this.callOpenAI(text, systemPrompt, 500, 0.7);
  }

  static async generateMultipleReplyOptions(context: string, userPrefs: Partial<UserPreferences>, emailContext: EmailContext): Promise<SmartReplyOption[]> {
    const baseSystemPrompt = `${AI_CONFIGS.optimail.systemPrompt}

User Preferences: Tone: ${userPrefs?.tone || 'professional'}, Language: ${userPrefs?.language || 'en'}
Email Context: ${emailContext.summary}

Generate 3 different reply approaches:
1. Quick & Direct (concise, gets to the point)
2. Detailed & Thorough (comprehensive response)
3. Warm & Personal (friendly, relationship-building)

For each approach, provide ONLY the email body text, no labels or prefixes.
Separate each option with "---OPTION---"`;

    try {
  const response = await this.callOpenAI(context.slice(0, 3000), baseSystemPrompt, 800, 0.5);
      const options = response.split('---OPTION---').filter(opt => opt.trim().length > 20);
      
      return options.slice(0, 3).map((body, index) => ({
        id: `reply_${index}`,
        label: ['Quick & Direct', 'Detailed & Thorough', 'Warm & Personal'][index] || `Option ${index + 1}`,
        body: body.trim(),
        score: 0.85 - (index * 0.05)
      }));
    } catch (error) {
      console.error('Multiple replies generation error:', error);
      return [];
    }
  }
}

// Helper function to load user preferences from Supabase
async function loadUserPreferences(bodyPrefs?: Partial<UserPreferences>): Promise<Partial<UserPreferences>> {
  try {
    // If Supabase is configured, try to load user profile
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
  createClient(supabaseUrl, supabaseKey); // initialized if needed later
      
      // TODO: Implement user authentication and profile lookup
      const defaults: Partial<UserPreferences> = {
        tone: 'professional',
        language: 'en',
        autoIncludeSignature: true,
        signature: ''
      };
      
      return { ...defaults, ...bodyPrefs };
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }

  // Fallback to body preferences or defaults
  return bodyPrefs || {
    tone: 'professional' as const,
    language: 'en',
    autoIncludeSignature: true,
    signature: ''
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: AgentRequestBody = await req.json();
    const input = body.input?.trim();
    if (!input) return NextResponse.json({ error: 'Missing input' }, { status: 400 });

    // 1. Intent routing (fast heuristic + Cohere classification)
    const routing = routeIntent(input);
    const steps: AgentStep[] = [
      { id: 'route', state: 'complete', label: `Intent: ${routing.detected.intent}`, output: JSON.stringify(routing.detected) },
    ];

    // 2. Extract email context if it looks like an email was pasted
    let emailContext: EmailContext = { entities: {}, summary: '', tone: 'professional' };
    if (input.length > 200) {
      try {
        emailContext = await LLMRouter.extractEmailContext(input);
        steps.push({ id: 'extract', state: 'complete', label: 'Context extracted', output: emailContext.summary });
      } catch (error) {
        steps.push({ id: 'extract', state: 'error', label: 'Context extraction', error: (error as Error).message });
      }
    }

    // 3. Load user preferences from Supabase or use defaults
    const userPrefs: Partial<UserPreferences> = await loadUserPreferences(body.preferences);

    let replyOptions: SmartReplyOption[] | undefined;
    let finalText = '';

    // 4. Handle different intents with appropriate models
    switch (routing.detected.intent) {
      case 'reply':
        try {
          replyOptions = await LLMRouter.generateMultipleReplyOptions(input, userPrefs, emailContext);
          steps.push({ 
            id: 'reply-gen', 
            state: 'complete', 
            label: 'Smart replies generated', 
            output: `${replyOptions.length} options created` 
          });
        } catch (error) {
          steps.push({ 
            id: 'reply-gen', 
            state: 'error', 
            label: 'Reply generation', 
            error: (error as Error).message 
          });
        }
        break;

      case 'summarize':
        try {
          finalText = await LLMRouter.summarizeEmail(input);
          steps.push({ 
            id: 'summary', 
            state: 'complete', 
            label: 'Summary generated', 
            output: finalText.slice(0, 120) + '...' 
          });
        } catch (error) {
          steps.push({ 
            id: 'summary', 
            state: 'error', 
            label: 'Summarization', 
            error: (error as Error).message 
          });
        }
        break;

      case 'compose':
        try {
          // Use same structured drafting flow for compose
          finalText = await LLMRouter.generateReply(input, userPrefs, emailContext);
          steps.push({ 
            id: 'compose', 
            state: 'complete', 
            label: 'Email drafted', 
            output: finalText.slice(0, 120) + '...' 
          });
        } catch (error) {
          steps.push({ 
            id: 'compose', 
            state: 'error', 
            label: 'Email composition', 
            error: (error as Error).message 
          });
        }
        break;

      case 'translate':
      case 'tone':
        try {
          const targetTone = body.forcedIntent === 'tone' ? 'friendly' : userPrefs.tone || 'professional';
          const targetLang = userPrefs.language || 'en';
          finalText = await LLMRouter.translateAndRewrite(input, targetTone, targetLang);
          steps.push({ 
            id: 'rewrite', 
            state: 'complete', 
            label: 'Text rewritten', 
            output: finalText.slice(0, 120) + '...' 
          });
        } catch (error) {
          steps.push({ 
            id: 'rewrite', 
            state: 'error', 
            label: 'Text rewriting', 
            error: (error as Error).message 
          });
        }
        break;

      case 'schedule':
        try {
          // Generate calendar event suggestions
          const eventSuggestion = {
            title: 'Meeting Discussion',
            durationMinutes: 30,
            urgency: 'medium' as const,
            attendees: Array.from(new Set((input.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g) || [])))
          };
          
          steps.push({ 
            id: 'calendar', 
            state: 'complete', 
            label: 'Meeting suggested', 
            output: `${eventSuggestion.title} (${eventSuggestion.durationMinutes}m)` 
          });

          // Add calendar suggestion to response
          routing.calendar = eventSuggestion;

          // Draft a confirmation email using structured rules
          const sign = buildSignoff(userPrefs, userPrefs.tone);
          const { subject, body } = renderDraft({
            subject: enforceSubject('Confirm meeting time'),
            lead: 'Thanks for suggesting a meeting — here are quick options.',
            purpose: [
              'I can meet this week to discuss the agenda.',
              `Happy to keep it to ${eventSuggestion.durationMinutes} minutes.`
            ],
            options: [
              'Tue 10:00–10:30',
              'Wed 14:00–14:30',
              'Thu 16:00–16:30'
            ],
            cta: 'Reply with the best slot or propose another time.',
            signoff: sign
          }, { language: userPrefs.language, tone: userPrefs.tone, targetWords: { min: 80, max: 140 } });
          finalText = `Subject: ${subject}\n\n${body}`;
        } catch (error) {
          steps.push({ 
            id: 'calendar', 
            state: 'error', 
            label: 'Calendar scheduling', 
            error: (error as Error).message 
          });
        }
        break;

      case 'template.save':
        try {
          finalText = 'Template save functionality will prompt user for confirmation with extracted content structure.';
          steps.push({ 
            id: 'template-save', 
            state: 'complete', 
            label: 'Template save prepared', 
            output: 'Ready to save with extracted structure' 
          });
        } catch (error) {
          steps.push({ 
            id: 'template-save', 
            state: 'error', 
            label: 'Template saving', 
            error: (error as Error).message 
          });
        }
        break;

      default:
        // For unknown intents, provide general assistance
        try {
          finalText = await LLMRouter.generateReply(
            `Help the user with: ${input}`, 
            userPrefs, 
            { entities: {}, summary: 'General assistance request', tone: 'helpful' }
          );
          steps.push({ 
            id: 'general', 
            state: 'complete', 
            label: 'General assistance', 
            output: 'Contextual help provided' 
          });
        } catch (error) {
          steps.push({ 
            id: 'general', 
            state: 'error', 
            label: 'General assistance', 
            error: (error as Error).message 
          });
        }
    }

    // 5. Add confidence scoring and auto-send logic
    const confidence = routing.detected.confidence;
    const trust = Math.max(0, Math.min(1, userPrefs.trust_level ?? 0.0));
    const autoSendThreshold = 0.9 * (0.95 - 0.15 + (trust * 0.15)); // scale with trust
  const hasReplyChoices = !!(replyOptions && replyOptions.length > 0);
  const hasDraft = !!finalText && finalText.length > 20;
  const shouldAutoSend = confidence >= autoSendThreshold && (hasReplyChoices || hasDraft);
    steps.push({
      id: 'auto-send-eval',
      state: 'complete',
      label: 'Auto-send evaluation',
      output: `intent_confidence=${confidence.toFixed(2)} trust_level=${trust.toFixed(2)} threshold=${autoSendThreshold.toFixed(2)} result=${shouldAutoSend}`
    });

    // 6. Cross-module routing suggestions
  const crossModuleSuggestions = routing.crossModule || [];

    const response: AgentResponse = {
      finalText,
      steps,
      replyOptions,
  actionSuggestions: [...routing.actionSuggestions, ...crossModuleSuggestions],
      calendar: routing.calendar || null,
      intent: routing.detected,
      templates: [], // Will be populated if user requests templates
    };

    // Add auto-send metadata if confidence is high
  if (shouldAutoSend) {
      response.autoSend = {
        confidence,
        countdownSeconds: 3,
        recipientHint: (emailContext.entities.recipient as string) || (emailContext.entities.sender as string) || 'recipient'
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('OptiMail agent error', error);
    return NextResponse.json({ error: 'Agent failure', details: (error as Error).message }, { status: 500 });
  }
}
