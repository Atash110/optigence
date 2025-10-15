import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SuggestionRequest {
  content: string;
  position: number;
  userId: string;
  threadId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { content, position, userId, threadId }: SuggestionRequest = await request.json();

    if (!content.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    // Generate live suggestions using GPT
    const suggestions = await generateLiveSuggestions(content, position);

    return NextResponse.json({
      suggestions,
      timestamp: new Date().toISOString(),
      userId,
      threadId
    });

  } catch (error) {
    console.error('Live suggestions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions',
        suggestions: []
      },
      { status: 500 }
    );
  }
}

async function generateLiveSuggestions(content: string, position: number) {
  const suggestions = [];

  try {
    // Get the text around the cursor position
    const beforeCursor = content.slice(0, position);
    const afterCursor = content.slice(position);
    const currentSentence = extractCurrentSentence(content, position);

    // Grammar and style suggestions
    if (currentSentence.length > 10) {
      const grammarSuggestion = await getGrammarSuggestion(currentSentence);
      if (grammarSuggestion) {
        suggestions.push({
          id: `grammar_${Date.now()}`,
          type: 'grammar_fix',
          position: beforeCursor.lastIndexOf(currentSentence),
          original: currentSentence,
          suggestion: grammarSuggestion,
          confidence: 0.8,
          reason: 'Grammar and clarity improvement',
          auto_apply: false
        });
      }
    }

    // Tone suggestions
    if (content.length > 50) {
      const toneSuggestion = await getToneSuggestion(content);
      if (toneSuggestion) {
        suggestions.push({
          id: `tone_${Date.now()}`,
          type: 'tone_adjustment',
          position: 0,
          original: content,
          suggestion: toneSuggestion,
          confidence: 0.7,
          reason: 'Tone enhancement for professional communication',
          auto_apply: false
        });
      }
    }

    // Content completion suggestions
    if (beforeCursor.endsWith(' ')) {
      const completionSuggestion = await getContentCompletion(beforeCursor, afterCursor);
      if (completionSuggestion) {
        suggestions.push({
          id: `completion_${Date.now()}`,
          type: 'content_improvement',
          position: position,
          original: '',
          suggestion: completionSuggestion,
          confidence: 0.6,
          reason: 'Suggested content completion',
          auto_apply: false
        });
      }
    }

  } catch (error) {
    console.error('Error generating suggestions:', error);
  }

  return suggestions;
}

function extractCurrentSentence(text: string, position: number): string {
  const beforeCursor = text.slice(0, position);
  const afterCursor = text.slice(position);

  // Find sentence boundaries
  const sentenceStart = Math.max(
    beforeCursor.lastIndexOf('.'),
    beforeCursor.lastIndexOf('!'),
    beforeCursor.lastIndexOf('?'),
    0
  );

  const sentenceEnd = Math.min(
    afterCursor.indexOf('.'),
    afterCursor.indexOf('!'),
    afterCursor.indexOf('?')
  );

  const start = sentenceStart === 0 ? 0 : sentenceStart + 1;
  const end = sentenceEnd === -1 ? text.length : position + sentenceEnd + 1;

  return text.slice(start, end).trim();
}

async function getGrammarSuggestion(sentence: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional writing assistant. Improve the grammar, clarity, and style of the given sentence. If the sentence is already good, return null. Keep the same tone and meaning. Return only the improved sentence or null.'
        },
        {
          role: 'user',
          content: sentence
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    });

    const improvement = response.choices[0]?.message?.content?.trim();
    
    if (improvement && improvement !== sentence && improvement !== 'null') {
      return improvement;
    }

    return null;

  } catch (error) {
    console.error('Grammar suggestion error:', error);
    return null;
  }
}

async function getToneSuggestion(content: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze the tone of this email content. If it could be more professional, friendly, or clear, provide a brief suggestion (max 100 characters). If the tone is already appropriate, return null.'
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 50,
      temperature: 0.4
    });

    const suggestion = response.choices[0]?.message?.content?.trim();
    
    if (suggestion && suggestion !== 'null' && suggestion.length > 10) {
      return suggestion;
    }

    return null;

  } catch (error) {
    console.error('Tone suggestion error:', error);
    return null;
  }
}

async function getContentCompletion(beforeCursor: string, afterCursor: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Complete this email text with 1-3 words that would naturally follow. Keep it professional and concise. If no completion is needed, return null.'
        },
        {
          role: 'user',
          content: `Before cursor: "${beforeCursor}"\nAfter cursor: "${afterCursor}"`
        }
      ],
      max_tokens: 20,
      temperature: 0.5
    });

    const completion = response.choices[0]?.message?.content?.trim();
    
    if (completion && completion !== 'null' && completion.split(' ').length <= 3) {
      return completion;
    }

    return null;

  } catch (error) {
    console.error('Content completion error:', error);
    return null;
  }
}
