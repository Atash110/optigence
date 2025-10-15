import { NextRequest, NextResponse } from 'next/server';

// Type definitions for global broadcast events
declare global {
  var broadcastEvents: Map<string, BroadcastEvent[]> | undefined;
}

interface BroadcastEvent {
  type: string;
  userId?: string;
  timestamp: number;
  excludeUserId?: string;
  participants?: string[];
  content?: string;
  position?: number;
}

// Store active collaboration sessions
const collaborativeSessions = new Map<string, {
  participants: Set<string>;
  content: string;
  lastUpdate: number;
  threadId?: string;
}>();

// Store typing indicators
const typingIndicators = new Map<string, {
  userId: string;
  sessionId: string;
  timestamp: number;
}>();

interface CollaborationEvent {
  type: 'join_session' | 'leave_session' | 'content_update' | 'typing_start' | 'typing_stop';
  sessionId: string;
  userId: string;
  data?: {
    content?: string;
    position?: number;
    selection?: { start: number; end: number };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CollaborationEvent = await request.json();
    const { type, sessionId, userId, data } = body;

    // Initialize Socket.IO server if not already done
    // (Placeholder - real Socket.IO would be initialized elsewhere)

    switch (type) {
      case 'join_session':
        return handleJoinSession(sessionId, userId);
      
      case 'leave_session':
        return handleLeaveSession(sessionId, userId);
      
      case 'content_update':
        return handleContentUpdate(sessionId, userId, data?.content || '', data?.position);
      
      case 'typing_start':
        return handleTypingStart(sessionId, userId);
      
      case 'typing_stop':
        return handleTypingStop(sessionId, userId);
      
      default:
        return NextResponse.json({ error: 'Unknown collaboration event type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Collaboration API error:', error);
    return NextResponse.json(
      { error: 'Failed to process collaboration event' },
      { status: 500 }
    );
  }
}



function handleJoinSession(sessionId: string, userId: string) {
  if (!collaborativeSessions.has(sessionId)) {
    collaborativeSessions.set(sessionId, {
      participants: new Set(),
      content: '',
      lastUpdate: Date.now()
    });
  }

  const session = collaborativeSessions.get(sessionId)!;
  session.participants.add(userId);

  // Broadcast to other participants
  broadcastToSession(sessionId, {
    type: 'user_joined',
    userId,
    participants: Array.from(session.participants),
    content: session.content
  });

  return NextResponse.json({
    success: true,
    session: {
      id: sessionId,
      participants: Array.from(session.participants),
      content: session.content,
      lastUpdate: session.lastUpdate
    }
  });
}

function handleLeaveSession(sessionId: string, userId: string) {
  const session = collaborativeSessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  session.participants.delete(userId);

  // Clean up typing indicators
  for (const [indicatorId, indicator] of typingIndicators) {
    if (indicator.userId === userId && indicator.sessionId === sessionId) {
      typingIndicators.delete(indicatorId);
    }
  }

  // Remove session if no participants left
  if (session.participants.size === 0) {
    collaborativeSessions.delete(sessionId);
  } else {
    // Broadcast to remaining participants
    broadcastToSession(sessionId, {
      type: 'user_left',
      userId,
      participants: Array.from(session.participants)
    });
  }

  return NextResponse.json({ success: true });
}

function handleContentUpdate(sessionId: string, userId: string, content: string, position?: number) {
  const session = collaborativeSessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Update session content
  session.content = content;
  session.lastUpdate = Date.now();

  // Broadcast content update to other participants
  broadcastToSession(sessionId, {
    type: 'content_updated',
    userId,
    content,
    position,
    timestamp: session.lastUpdate
  }, userId); // Exclude the sender

  return NextResponse.json({
    success: true,
    timestamp: session.lastUpdate
  });
}

function handleTypingStart(sessionId: string, userId: string) {
  const indicatorId = `${sessionId}_${userId}`;
  typingIndicators.set(indicatorId, {
    userId,
    sessionId,
    timestamp: Date.now()
  });

  // Broadcast typing start to other participants
  broadcastToSession(sessionId, {
    type: 'typing_started',
    userId
  }, userId);

  // Auto-cleanup after 3 seconds
  setTimeout(() => {
    const indicator = typingIndicators.get(indicatorId);
    if (indicator && Date.now() - indicator.timestamp >= 3000) {
      typingIndicators.delete(indicatorId);
      broadcastToSession(sessionId, {
        type: 'typing_stopped',
        userId
      }, userId);
    }
  }, 3000);

  return NextResponse.json({ success: true });
}

function handleTypingStop(sessionId: string, userId: string) {
  const indicatorId = `${sessionId}_${userId}`;
  typingIndicators.delete(indicatorId);

  // Broadcast typing stop to other participants
  broadcastToSession(sessionId, {
    type: 'typing_stopped',
    userId
  }, userId);

  return NextResponse.json({ success: true });
}

function broadcastToSession(sessionId: string, message: Partial<BroadcastEvent>, excludeUserId?: string) {
  // In a real implementation, this would use Socket.IO to broadcast
  // For now, we'll store these events for polling-based real-time updates
  
  console.log(`Broadcasting to session ${sessionId}:`, message);
  
  // Store the broadcast event for polling clients
  if (!globalThis.broadcastEvents) {
    globalThis.broadcastEvents = new Map();
  }
  
  if (!globalThis.broadcastEvents.has(sessionId)) {
    globalThis.broadcastEvents.set(sessionId, []);
  }
  
  const events = globalThis.broadcastEvents.get(sessionId);
  if (events) {
    events.push({
      ...message,
      timestamp: Date.now(),
      excludeUserId
    } as BroadcastEvent);
    
    // Keep only last 50 events per session
    if (events.length > 50) {
      globalThis.broadcastEvents.set(sessionId, events.slice(-50));
    }
  }
}

// GET endpoint for polling-based real-time updates
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const userId = url.searchParams.get('userId');
    const lastTimestamp = parseInt(url.searchParams.get('lastTimestamp') || '0');

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
    }

    // Get events for this session since lastTimestamp
    const events = globalThis.broadcastEvents?.get(sessionId) || [];
    const newEvents = events
      .filter((event: BroadcastEvent) => 
        event.timestamp > lastTimestamp && 
        event.excludeUserId !== userId
      )
      .slice(-20); // Return max 20 events

    // Get current session state
    const session = collaborativeSessions.get(sessionId);
    const currentTypingUsers = Array.from(typingIndicators.values())
      .filter(indicator => 
        indicator.sessionId === sessionId && 
        indicator.userId !== userId &&
        Date.now() - indicator.timestamp < 5000 // Only active typing (within 5 seconds)
      )
      .map(indicator => indicator.userId);

    return NextResponse.json({
      events: newEvents,
      session: session ? {
        participants: Array.from(session.participants),
        content: session.content,
        lastUpdate: session.lastUpdate
      } : null,
      typingUsers: currentTypingUsers,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Collaboration polling error:', error);
    return NextResponse.json(
      { error: 'Failed to get collaboration updates' },
      { status: 500 }
    );
  }
}
