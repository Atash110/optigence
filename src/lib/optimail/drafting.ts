// Utilities for enforcing compact, action-focused OptiMail drafts and explanations
import { UserPreferences } from '@/types/optimail';

export type DraftSection = {
  subject: string; // <= 6 words, action-focused
  lead: string; // 1 short sentence with context & gratitude
  purpose: string[]; // 2–3 compact lines
  options?: string[]; // optional list
  cta: string; // single next step
  signoff: string; // aligned to user tone plus signature
  ps?: string; // optional if meaningfully helpful
};

export interface DraftConstraints {
  language?: string; // ISO code
  tone?: UserPreferences['tone'] | 'concise' | 'empathetic' | 'formal' | 'friendly' | 'professional';
  targetWords?: { min: number; max: number }; // default 80–140
}

export function clampWords(text: string, min = 80, max = 140): string {
  // Prefer to trim by sentences while keeping coherence
  const words = text.trim().split(/\s+/);
  if (words.length <= max && words.length >= min) return text.trim();
  // Trim to last sentence boundary under max
  const joined = words.slice(0, max + 10).join(' ');
  const sentences = joined.split(/(?<=[.!?])\s+/);
  let acc = '';
  for (const s of sentences) {
    if ((acc + (acc ? ' ' : '') + s).split(/\s+/).length > max) break;
    acc = acc ? `${acc} ${s}` : s;
  }
  return acc || words.slice(0, max).join(' ');
}

export function buildSignoff(prefs: Partial<UserPreferences>, tone?: DraftConstraints['tone']): string {
  const toneMap: Record<string, string> = {
    professional: 'Best regards',
    formal: 'Sincerely',
    friendly: 'Thanks',
    casual: 'Thanks',
  };
  const base = tone ? toneMap[tone] || 'Best regards' : toneMap[prefs.tone || 'professional'] || 'Best regards';
  const sig = prefs.autoIncludeSignature !== false && prefs.signature ? `\n${prefs.signature.trim()}` : '';
  return `${base},${sig ? `\n${sig}` : ''}`;
}

export function renderDraft(section: DraftSection, constraints?: DraftConstraints): { subject: string; body: string } {
  const min = constraints?.targetWords?.min ?? 80;
  const max = constraints?.targetWords?.max ?? 140;
  const parts: string[] = [];
  if (section.lead) parts.push(section.lead.trim());
  if (section.purpose?.length) parts.push(section.purpose.map(l => l.trim()).join(' '));
  if (section.options?.length) parts.push(section.options.map(o => `• ${o.trim()}`).join('\n'));
  if (section.cta) parts.push(section.cta.trim());
  if (section.signoff) parts.push(section.signoff.trim());
  if (section.ps) parts.push(`PS: ${section.ps.trim()}`);
  const bodyRaw = parts.filter(Boolean).join('\n\n');
  const body = clampWords(bodyRaw, min, max);
  const subj = section.subject.trim().replace(/\.$/, '');
  return { subject: subj, body };
}

export function enforceSubject(subject: string): string {
  // Keep <= 6 words and action-focused: remove filler
  const words = subject.trim().replace(/[.:!?]+$/,'').split(/\s+/);
  const trimmed = words.slice(0, 6).join(' ');
  return trimmed;
}

export function buildWhyThis(action: 'reply' | 'schedule' | 'save_template' | 'add_calendar' | 'handoff' | 'auto_send' | 'translate' | 'summarize', context: Record<string, unknown>): string {
  const ctx = context as { hasQuestions?: boolean; hasTimeReferences?: boolean; recipients?: string[] };
  const hasQuestions = Boolean(ctx.hasQuestions);
  const hasTimeReferences = Boolean(ctx.hasTimeReferences);
  const recipients = ctx.recipients;
  switch (action) {
    case 'reply':
      return hasQuestions
        ? 'Detected direct questions; a quick reply reduces back-and-forth.'
        : 'A timely response keeps momentum and clarity.';
    case 'schedule':
      return hasTimeReferences
        ? 'Found time cues; proposing slots removes friction.'
        : 'Suggesting times speeds up scheduling.';
    case 'add_calendar':
      return 'Timing signals present; adding an event prevents misses.';
    case 'save_template':
      return 'Message pattern repeats; saving as a template speeds future replies.';
    case 'auto_send':
      return recipients && recipients.length
        ? 'High confidence with known recipient; safe to send without review.'
        : 'High confidence; auto-send available with quick cancel.';
    case 'translate':
      return 'Recipient language differs; translating maximizes clarity and respect.';
    case 'summarize':
      return 'Long thread detected; summary highlights key asks and next steps.';
    default:
      return 'Context suggests this action will reduce effort and improve clarity.';
  }
}

export type HandoffTarget = 'optitrip' | 'optishop' | 'optihire';

export function buildHandoffSummary(target: HandoffTarget, payload: Partial<{ intent: string; entities: Record<string, unknown>; notes: string }>): string {
  // Compact, transferable summary
  const base = {
    module: target,
  intent: payload.intent || 'assist',
  entities: payload.entities || {},
  notes: payload.notes || '',
  };
  return JSON.stringify(base);
}
