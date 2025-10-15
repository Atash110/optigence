import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_CONFIGS, AIModule } from '@/lib/openai';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, module, conversation = [] }: {
      message: string;
      module?: string;
      conversation?: ConversationMessage[];
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const aiModule = (module as AIModule) || 'superficial';
    const config = AI_CONFIGS[aiModule];

    if (!config) {
      return NextResponse.json(
        { error: 'Invalid AI module' },
        { status: 400 }
      );
    }

    // Build conversation history
    const messages = [
      {
        role: 'system' as const,
        content: config.systemPrompt,
      },
      ...conversation.map((msg: ConversationMessage) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: false,
    });

    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: responseMessage,
      module: aiModule,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
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
