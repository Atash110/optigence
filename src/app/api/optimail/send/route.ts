import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, recipient } = body;
    
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Email content is required' },
        { status: 400 }
      );
    }

    // Mock email sending - in production, this would integrate with Gmail API, SendGrid, etc.
    console.log('Sending email to:', recipient);
    console.log('Content:', content);
    
    // Simulate send delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success response
    return NextResponse.json({
      success: true,
      messageId: `msg_${Date.now()}`,
      recipient: recipient || 'recipient',
      sentAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
