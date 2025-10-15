import { DetectedIntent, IntentRouterResult, OptiMailIntent, ActionSuggestion, CalendarSuggestion } from '@/types/optimail';
import { buildWhyThis } from './drafting';

// Lightweight heuristic router (can be upgraded to model-based later)
const intentPatterns: Array<{ intent: OptiMailIntent; patterns: RegExp[]; base: number }> = [
  { intent: 'reply', patterns: [/^re:/i, /\breply\b/i, /\brespond\b/i, /\bwrite back\b/i], base: 0.55 },
  { intent: 'compose', patterns: [/^draft\b/i, /\bwrite (an )?email\b/i, /\bcompose\b/i, /\bnew email\b/i], base: 0.5 },
  { intent: 'summarize', patterns: [/\bsummariz/i, /\btl;dr\b/i, /\bkey points\b/i], base: 0.5 },
  { intent: 'translate', patterns: [/\btranslate\b/i, /\binto (french|spanish|german|turkish|italian)\b/i], base: 0.55 },
  { intent: 'template.save', patterns: [/\bsave (as )?template\b/i, /\bstore this\b/i], base: 0.6 },
  { intent: 'template.insert', patterns: [/\buse template\b/i, /\binsert template\b/i], base: 0.55 },
  { intent: 'schedule', patterns: [/\bmeeting\b/i, /\bschedule\b/i, /\bcall\b/i, /\bcalendar\b/i], base: 0.5 },
  { intent: 'tone', patterns: [/\b(make|sound) more (formal|casual|friendly|professional)\b/i], base: 0.5 },
  { intent: 'language', patterns: [/\bswitch language\b/i, /\bchange language\b/i], base: 0.5 },
];

const crossModulePatterns: Array<{ intent: OptiMailIntent; patterns: RegExp[]; label: string; icon: string }> = [
  { intent: 'cross.travel', patterns: [/\bflight\b/i, /\btravel\b/i, /\btrip\b/i, /\bhotel\b/i], label: 'Plan with OptiTrip', icon: '✈️' },
  { intent: 'cross.shop', patterns: [/\bbuy\b/i, /\bpurchase\b/i, /\bproduct\b/i, /\bprice\b/i], label: 'Open in OptiShop', icon: '🛍️' },
  { intent: 'cross.hire', patterns: [/\bjob\b/i, /\bresume\b/i, /\bapplication\b/i, /\binterview\b/i], label: 'Handle in OptiHire', icon: '💼' },
];

function scoreIntent(input: string): DetectedIntent {
  const lower = input.toLowerCase();
  let best: DetectedIntent = { intent: 'unknown', confidence: 0.2 };
  const secondary: DetectedIntent[] = [];
  for (const cfg of intentPatterns) {
    let score = 0;
    for (const rx of cfg.patterns) {
      if (rx.test(lower)) score += 0.25;
    }
    if (score > 0) score += cfg.base;
    if (score > best.confidence) {
      if (best.intent !== 'unknown') secondary.push(best);
      best = { intent: cfg.intent, confidence: Math.min(0.95, score) };
    } else if (score > 0.45) {
      secondary.push({ intent: cfg.intent, confidence: score });
    }
  }
  if (secondary.length) best.secondary = secondary.map(s => s.intent);
  return best;
}

function deriveActionSuggestions(det: DetectedIntent, input: string): ActionSuggestion[] {
  const base: ActionSuggestion[] = [];
  const push = (intent: OptiMailIntent, text: string, priority: number, icon?: string, meta?: Record<string, unknown>) =>
    base.push({ id: `${intent}-${priority}-${base.length}`, intent, text, priority, icon, meta, why: buildWhyThis(
      intent === 'reply' ? 'reply' : intent === 'schedule' ? 'schedule' : intent === 'template.save' ? 'save_template' : intent === 'translate' ? 'translate' : intent === 'summarize' ? 'summarize' : 'handoff',
      { hasTimeReferences: /(meeting|schedule|call)/i.test(input), hasQuestions: /\?/i.test(input) }
    ) });

  switch (det.intent) {
    case 'reply':
      push('reply', 'Generate smart reply options', 95, '✨');
      push('schedule', 'Offer meeting times', 70, '📅');
      push('template.save', 'Save this structure as template', 55, '📁');
      break;
    case 'compose':
      push('compose', 'Draft full email', 90, '📝');
      push('tone', 'Adjust tone', 65, '🎚️');
      push('template.insert', 'Insert a template', 60, '📂');
      break;
    case 'summarize':
      push('summarize', 'Generate concise summary', 90, '🧠');
      push('reply', 'Prepare a contextual reply', 65, '✉️');
      break;
    case 'schedule':
      push('schedule', 'Suggest optimal time slots', 90, '📅');
      push('compose', 'Draft meeting confirmation email', 75, '📝');
      break;
    case 'translate':
      push('translate', 'Translate to preferred language', 90, '🌐');
      push('tone', 'Refine tone after translation', 60, '🎚️');
      break;
    case 'template.save':
      push('template.save', 'Confirm & save template', 90, '📁');
      push('template.insert', 'Reuse an existing template', 55, '📂');
      break;
    default:
      push('compose', 'Compose email', 70, '📝');
      push('reply', 'Reply assistance', 60, '✨');
      push('summarize', 'Summarize content', 55, '🧠');
  }

  // Light heuristics: long pasted block -> reply/summarize emphasis
  if (input.length > 400 && !base.some(b => b.intent === 'summarize')) {
    push('summarize', 'Quick summary of pasted content', 80, '🧠');
  }

  return base.sort((a, b) => b.priority - a.priority);
}

function detectCalendar(input: string): CalendarSuggestion | null {
  const hasMeeting = /(meeting|call|schedule|appointment)/i.test(input);
  if (!hasMeeting) return null;
  const urgency = /(asap|urgent|immediately|soon)/i.test(input) ? 'high' : 'medium';
  let durationMinutes = 30;
  const dm = /(\d+)\s*(min|minute)/i.exec(input);
  const hm = /(\d+)\s*(h|hour)/i.exec(input);
  if (dm) durationMinutes = parseInt(dm[1], 10);
  else if (hm) durationMinutes = parseInt(hm[1], 10) * 60;
  return {
    title: 'Proposed Meeting',
    durationMinutes,
    urgency,
    attendees: Array.from(new Set(input.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g) || []))
  };
}

function detectCrossModule(input: string): ActionSuggestion[] {
  const out: ActionSuggestion[] = [];
  for (const cfg of crossModulePatterns) {
    if (cfg.patterns.some(rx => rx.test(input))) {
      out.push({
        id: cfg.intent + '-' + out.length,
        intent: cfg.intent,
        text: cfg.label,
        icon: cfg.icon,
        priority: 50 + 5 * out.length,
      });
    }
  }
  return out;
}

export function routeIntent(input: string): IntentRouterResult {
  const detected = scoreIntent(input);
  const actionSuggestions = deriveActionSuggestions(detected, input);
  const calendar = detectCalendar(input);
  const crossModule = detectCrossModule(input);
  return { detected, actionSuggestions, calendar, crossModule };
}

const intentRouter = { routeIntent };
export default intentRouter;
