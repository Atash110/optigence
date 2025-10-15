import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_CONFIGS } from '@/lib/openai';

interface EmailRequest {
  action: 'compose' | 'reply' | 'template' | 'optimize' | 'summarize' | 'rewrite' | 'tone_analysis' | 'voice_start' | 'voice_stop' | 'insights' | 'feedback' | 'realtime_suggestions';
  emailData: {
    to?: string;
    subject?: string;
    body?: string;
    originalEmail?: string;
    purpose?: string;
    tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'empathetic' | 'persuasive' | 'urgent';
    language?: string;
    intent?: string;
    style?: string;
  };
  instructions?: string;
  
  // Advanced features
  partialInput?: string;
  context?: {
    recipient?: string;
    subject?: string;
    existingContent?: string;
  };
  originalRequest?: Record<string, unknown>;
  generatedResponse?: string;
  feedback?: 'positive' | 'negative' | 'neutral';
  improvements?: string;
  sessionId?: string;
  feature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, emailData, instructions }: EmailRequest = await request.json();

    if (!action || !emailData) {
      return NextResponse.json(
        { error: 'Action and email data are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const config = AI_CONFIGS.optimail;
    
    // Build specific prompt based on action
    let prompt = '';
    
    switch (action) {
      case 'compose':
        const intentContext = emailData.intent ? `\nContext: This appears to be a ${emailData.intent} email.` : '';
        prompt = `You are OptiMail, an AI email assistant. Compose a ${emailData.tone || 'professional'} email with the following details:
        
        Purpose: ${emailData.purpose || 'General communication'}
        Tone: ${emailData.tone || 'professional'}${intentContext}
        
        ${instructions ? `Additional instructions: ${instructions}` : ''}
        
        Requirements:
        - Write a complete email with subject line, greeting, body, and closing
        - Match the requested tone perfectly
        - Be concise but comprehensive
        - Include appropriate context and emotion
        - Make it sound natural and human-like
        
        Please provide a well-structured email that sounds like it was written by a thoughtful human.`;
        break;
        
      case 'reply':
        prompt = `You are OptiMail, an AI email assistant. Please help me reply to this email in a ${emailData.tone || 'professional'} tone:
        
        Original Email:
        ${emailData.originalEmail || '[Original email content needed]'}
        
        ${instructions ? `Reply instructions: ${instructions}` : ''}
        
        Please provide 2-3 different reply options:
        1. A concise, direct response
        2. A more detailed, thoughtful response  
        3. A warm, relationship-building response
        
        Each response should be complete and ready to send.`;
        break;
        
      case 'summarize':
        prompt = `You are OptiMail, an AI email assistant. Please analyze and summarize this email thread:
        
        Email Thread:
        ${emailData.originalEmail || '[Email thread needed]'}
        
        Please provide:
        1. **Key Summary** (2-3 sentences)
        2. **Main Points** (bullet list)
        3. **Action Items** (if any)
        4. **Next Steps** (if applicable)
        5. **Important Dates/Deadlines** (if mentioned)
        
        Format the response clearly with headers and make it scannable.`;
        break;
        
      case 'rewrite':
        prompt = `You are OptiMail, an AI email assistant. Please rewrite this email to be ${instructions || 'improved'}:
        
        Original Email:
        ${emailData.body || '[Email content needed]'}
        
        Target tone: ${emailData.tone || 'professional'}
        Style modification: ${instructions || 'general improvement'}
        
        Please provide a rewritten version that:
        - Maintains the original message and intent
        - Improves clarity and impact
        - Matches the requested tone and style
        - Sounds natural and engaging
        
        Only return the rewritten email content.`;
        break;
        
      case 'tone_analysis':
        prompt = `You are OptiMail, an AI email assistant with expertise in emotional intelligence. Analyze the tone and emotion of this email:
        
        Email Content:
        ${emailData.body || emailData.originalEmail || '[Email content needed]'}
        
        Please provide:
        1. **Primary Emotion**: What is the main emotional tone?
        2. **Sentiment**: Positive, Neutral, or Negative
        3. **Formality Level**: Very Formal, Formal, Neutral, Casual, Very Casual
        4. **Urgency Level**: Low, Medium, High
        5. **Suggestions**: 2-3 specific suggestions for improvement
        
        Format as a structured analysis that's easy to understand.`;
        break;
        
      case 'template':
        prompt = `Create an email template for: ${emailData.purpose || 'general use'}
        
        Tone: ${emailData.tone || 'professional'}
        ${instructions ? `Requirements: ${instructions}` : ''}
        
        Please include placeholders for customization and provide usage tips.`;
        break;
        
      case 'optimize':
        prompt = `Please optimize this email for better clarity, professionalism, and impact:
        
        Original Email:
        Subject: ${emailData.subject || '[No subject]'}
        Body: ${emailData.body || '[Email body needed]'}
        
        ${instructions ? `Optimization goals: ${instructions}` : ''}
        
        Please provide the improved version with explanations of changes made.`;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      action,
      result: responseMessage,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('OptiMail API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
