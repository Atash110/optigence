// Core types for Optigence platform

export interface User {
  id: string;
  email?: string;
  name?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: SupportedLanguage;
  theme: 'light' | 'dark';
  defaultModule?: ModuleType;
  voiceEnabled: boolean;
  timezone?: string;
}

export type SupportedLanguage = 
  | 'en' // English
  | 'az' // Azerbaijani
  | 'tr' // Turkish
  | 'es' // Spanish
  | 'zh' // Chinese
  | 'de' // German
  | 'fr' // French
  | 'ru' // Russian
  | 'hi' // Hindi
  | 'ar'; // Arabic

export type ModuleType = 'mailgent' | 'shopora' | 'jobvera' | 'travelbuddy';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  moduleType?: ModuleType;
  metadata?: Record<string, unknown>;
}

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  module: ModuleType;
  parameters: Record<string, unknown>;
  suggestedActions?: string[];
}

export interface SuperficialAssistantState {
  isOpen: boolean;
  isListening: boolean;
  isProcessing: boolean;
  messages: AIMessage[];
  lastInteractions: AIMessage[];
}

// Module-specific types

// Mailgent
export interface EmailTemplate {
  id: string;
  title: string;
  content: string;
  tone: EmailTone;
  userId: string;
  createdAt: Date;
  tags?: string[];
}

export type EmailTone = 'formal' | 'friendly' | 'assertive' | 'empathetic' | 'apologetic';

export interface EmailComposition {
  to?: string;
  subject?: string;
  content: string;
  tone: EmailTone;
  context?: string;
  attachments?: string[];
}

// Shopora
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  vendor: string;
  url: string;
  availability: 'in-stock' | 'out-of-stock' | 'limited';
}

export interface ProductSearchQuery {
  query: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  rating?: number;
}

export interface ShoppingRecommendation {
  product: Product;
  reason: string;
  confidence: number;
  alternatives?: Product[];
}

// Jobvera
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits?: string[];
  url: string;
  postedDate: Date;
  remote: boolean;
}

export interface Resume {
  id: string;
  userId: string;
  name: string;
  content: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  updatedAt: Date;
}

export interface ExperienceItem {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  current: boolean;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
}

// TravelBuddy
export interface TripPlan {
  id: string;
  userId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  currency: string;
  travelers: number;
  preferences: TravelPreferences;
  itinerary: ItineraryItem[];
  createdAt: Date;
}

export interface TravelPreferences {
  accommodationType: 'hotel' | 'hostel' | 'apartment' | 'any';
  transportMode: 'flight' | 'train' | 'bus' | 'car' | 'any';
  activities: string[];
  dietaryRestrictions?: string[];
  accessibility?: string[];
}

export interface ItineraryItem {
  id: string;
  date: Date;
  time?: string;
  activity: string;
  location: string;
  cost?: number;
  duration?: number;
  notes?: string;
}

export interface TravelBuddy {
  id: string;
  userId: string;
  name: string;
  destination: string;
  travelDates: {
    start: Date;
    end: Date;
  };
  interests: string[];
  contactInfo: string;
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Environment variables
export interface AppConfig {
  openai: {
    apiKey: string;
    model: string;
  };  
  supabase: {
    url: string;
    anonKey: string;
  };
  auth: {
    username: string;
    password: string;
  };
}
