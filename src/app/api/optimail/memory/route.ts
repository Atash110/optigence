import { NextRequest, NextResponse } from 'next/server';
import MemoryContextService from '@/lib/memory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const action = searchParams.get('action');

    const memoryService = new MemoryContextService();
    await memoryService.initializeUser(userId);

    switch (action) {
      case 'context':
        const contextWindow = await memoryService.getContextWindow();
        return NextResponse.json(contextWindow);

      case 'suggestions':
        const input = searchParams.get('input') || '';
        const suggestions = await memoryService.getEmailSuggestions(input);
        return NextResponse.json(suggestions);

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '10');
        const history = await memoryService.getRecentEmails(limit);
        return NextResponse.json({ history });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: context, suggestions, or history' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      { 
        error: 'Memory operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'demo-user', action, data } = body;

    const memoryService = new MemoryContextService();
    await memoryService.initializeUser(userId);

    switch (action) {
      case 'save_email':
        await memoryService.saveEmailHistory(data);
        return NextResponse.json({ success: true });

      case 'update_preferences':
        await memoryService.updateUserMemory(data);
        return NextResponse.json({ success: true });

      case 'add_contact':
        await memoryService.addContact(data);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: save_email, update_preferences, or add_contact' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      { 
        error: 'Memory operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
