// OptiMail regenerated module types

export type OptiMailIntent =
	| 'compose'
	| 'reply'
	| 'summarize'
	| 'translate'
	| 'template.save'
	| 'template.insert'
	| 'schedule'
	| 'tone'
	| 'language'
	| 'cross.travel'
	| 'cross.shop'
	| 'cross.hire'
	| 'unknown';

export interface DetectedIntent {
	intent: OptiMailIntent;
	confidence: number; // 0-1
	secondary?: OptiMailIntent[];
	reasons?: string[];
}

export interface UserPreferences {
	userId?: string;
	tone: 'professional' | 'casual' | 'friendly' | 'formal';
	language: string; // ISO code
	signature?: string;
	autoIncludeSignature: boolean;
	/**
	 * Trust level for auto-send decisions (0-1). Higher means more confident auto-send when intent confidence is high.
	 */
	trust_level?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface EmailTemplate {
	id: string;
	title: string;
	content: string;
	language: string;
	tone: string;
	createdAt: string;
	updatedAt: string;
}

export interface SmartReplyOption {
	id: string;
	label: string; // Short descriptor shown on pill
	body: string;  // Full reply body (with placeholders)
	placeholders?: Array<{ key: string; label: string; example?: string }>;
	score: number;
}

export interface CalendarSuggestion {
	title: string;
	durationMinutes: number;
	urgency: 'low' | 'medium' | 'high';
	attendees: string[];
}

export interface ActionSuggestion {
	id: string;
	text: string;
	intent: OptiMailIntent;
	icon?: string; // Heroicon name or emoji
	priority: number; // 0-100
	meta?: Record<string, unknown>;
	why?: string;
}

export interface AgentStep {
	id: string;
	state: 'pending' | 'running' | 'complete' | 'error';
	label: string;
	output?: string;
	error?: string;
}

export interface AgentResponse {
	finalText?: string;
	steps: AgentStep[];
	replyOptions?: SmartReplyOption[];
	actionSuggestions?: ActionSuggestion[];
	calendar?: CalendarSuggestion | null;
	templates?: EmailTemplate[];
	intent: DetectedIntent;
	autoSend?: {
		confidence: number;
		countdownSeconds: number;
		recipientHint?: string;
	};
}

export interface AgentRequestBody {
	input: string;
	mode?: 'auto' | 'force.intent';
	forcedIntent?: OptiMailIntent;
	emailContext?: string;
	preferences?: Partial<UserPreferences>;
	draft?: string;
}

export interface FloatingCard {
	id: string;
	type: 'suggestion' | 'reply' | 'calendar' | 'template' | 'thinking';
	intent?: OptiMailIntent;
	content: string;
	meta?: Record<string, unknown>;
}

export interface MinimalMessage {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	createdAt: number;
	meta?: Record<string, unknown>;
}

export interface TypingSimulation {
	active: boolean;
	startedAt: number;
	estimatedMs: number;
	cursorChar: string;
}

export interface IntentRouterResult {
	detected: DetectedIntent;
	actionSuggestions: ActionSuggestion[];
	calendar?: CalendarSuggestion | null;
	crossModule?: ActionSuggestion[];
}

export interface TemplateSaveResult {
	success: boolean;
	template?: EmailTemplate;
	error?: string;
}

export interface SmartSlot {
	startTime: Date;
	endTime: Date;
	confidence: number; // 0-1
	attendeeCount: number;
	reasoning: string;
	conflictCount: number;
}
