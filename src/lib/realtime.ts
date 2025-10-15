/**
 * OptiMail Real-time Features Service
 * Phase 6: Live collaboration, real-time threading, and live suggestions
 */

import { io, Socket } from 'socket.io-client';

export interface RealtimeMessage {
  id: string;
  type: 'typing' | 'suggestion' | 'draft_update' | 'collaboration' | 'thread_update';
  userId: string;
  threadId?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface LiveSuggestion {
  id: string;
  type: 'tone_adjustment' | 'recipient_suggestion' | 'content_improvement' | 'grammar_fix';
  position: number;
  original: string;
  suggestion: string;
  confidence: number;
  reason: string;
  auto_apply?: boolean;
}

export interface ThreadParticipant {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  isTyping: boolean;
  lastSeen: string;
  role: 'owner' | 'collaborator' | 'viewer';
}

export interface LiveThread {
  id: string;
  subject: string;
  participants: ThreadParticipant[];
  currentDraft: string;
  suggestions: LiveSuggestion[];
  version: number;
  locked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  position: number;
  timestamp: string;
}

class RealtimeService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private currentThreadId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pollInterval: NodeJS.Timeout | null = null;

  // Event handlers
  private onMessageHandlers: ((message: RealtimeMessage) => void)[] = [];
  private onSuggestionHandlers: ((suggestion: LiveSuggestion) => void)[] = [];
  private onTypingHandlers: ((typing: TypingIndicator) => void)[] = [];
  private onCollaboratorHandlers: ((participants: ThreadParticipant[]) => void)[] = [];
  private onConnectionHandlers: ((connected: boolean) => void)[] = [];

  constructor() {
    // Initialize will be called when needed
  }

  /**
   * Initialize real-time connection
   */
  async initialize(userId: string, threadId?: string): Promise<void> {
    this.userId = userId;
    this.currentThreadId = threadId || null;

    try {
      // Initialize Socket.IO connection
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      
      this.socket = io(socketUrl, {
        query: {
          userId: this.userId,
          threadId: this.currentThreadId
        },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.setupEventListeners();
      console.log('Real-time service initialized for user:', userId);

    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      // Fall back to polling mode
      this.initializePollingFallback();
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to real-time server');
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
      this.notifyConnectionHandlers(false);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error: Error) => {
      this.reconnectAttempts++;
      console.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached, falling back to polling');
        this.initializePollingFallback();
      }
    });

    // Real-time message handling
    this.socket.on('message', (message: RealtimeMessage) => {
      this.handleRealtimeMessage(message);
    });

    this.socket.on('live_suggestion', (suggestion: LiveSuggestion) => {
      this.notifySuggestionHandlers(suggestion);
    });

    this.socket.on('typing_indicator', (typing: TypingIndicator) => {
      this.notifyTypingHandlers(typing);
    });

    this.socket.on('collaborators_update', (participants: ThreadParticipant[]) => {
      this.notifyCollaboratorHandlers(participants);
    });

    this.socket.on('thread_locked', (data: { userId: string; userName: string }) => {
      console.log(`Thread locked by ${data.userName}`);
    });

    this.socket.on('thread_unlocked', () => {
      console.log('Thread unlocked');
    });
  }

  /**
   * Handle incoming real-time messages
   */
  private handleRealtimeMessage(message: RealtimeMessage): void {
    // Don't process messages from self
    if (message.userId === this.userId) return;

    switch (message.type) {
      case 'draft_update':
        this.handleDraftUpdate(message);
        break;
      case 'thread_update':
        this.handleThreadUpdate(message);
        break;
      case 'collaboration':
        this.handleCollaborationEvent(message);
        break;
    }

    this.notifyMessageHandlers(message);
  }

  /**
   * Handle draft updates from collaborators
   */
  private handleDraftUpdate(message: RealtimeMessage): void {
    console.log('Draft updated by collaborator:', message.data);
    // Implementation would sync the draft content
  }

  /**
   * Handle thread updates
   */
  private handleThreadUpdate(message: RealtimeMessage): void {
    console.log('Thread updated:', message.data);
    // Implementation would update thread metadata
  }

  /**
   * Handle collaboration events
   */
  private handleCollaborationEvent(message: RealtimeMessage): void {
    console.log('Collaboration event:', message.data);
    // Implementation would handle join/leave events
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(position: number, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', {
      threadId: this.currentThreadId,
      position,
      isTyping,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send draft update
   */
  sendDraftUpdate(content: string, version: number): void {
    if (!this.socket?.connected) return;

    const message: Partial<RealtimeMessage> = {
      type: 'draft_update',
      userId: this.userId!,
      threadId: this.currentThreadId || undefined,
      data: { content, version },
      timestamp: new Date().toISOString()
    };

    this.socket.emit('draft_update', message);
  }

  /**
   * Request live suggestions
   */
  async requestLiveSuggestions(content: string, cursorPosition: number): Promise<LiveSuggestion[]> {
    if (!content.trim()) return [];

    try {
      // Real-time AI suggestions
      const response = await fetch('/api/optimail/realtime/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          position: cursorPosition,
          userId: this.userId,
          threadId: this.currentThreadId
        })
      });

      if (!response.ok) throw new Error('Suggestions request failed');

      const data = await response.json();
      return data.suggestions || [];

    } catch (error) {
      console.error('Failed to get live suggestions:', error);
      return [];
    }
  }

  /**
   * Join a thread for collaboration
   */
  async joinThread(threadId: string): Promise<LiveThread | null> {
    this.currentThreadId = threadId;

    if (this.socket?.connected) {
      this.socket.emit('join_thread', { threadId });
    }

    try {
      const response = await fetch(`/api/optimail/realtime/threads/${threadId}`, {
        method: 'GET',
        headers: { 'userId': this.userId! }
      });

      if (!response.ok) throw new Error('Failed to join thread');

      const thread = await response.json();
      return thread as LiveThread;

    } catch (error) {
      console.error('Failed to join thread:', error);
      return null;
    }
  }

  /**
   * Leave current thread
   */
  leaveThread(): void {
    if (this.socket?.connected && this.currentThreadId) {
      this.socket.emit('leave_thread', { threadId: this.currentThreadId });
    }
    this.currentThreadId = null;
  }

  /**
   * Create a new collaborative thread
   */
  async createThread(subject: string, initialContent: string): Promise<string | null> {
    try {
      const response = await fetch('/api/optimail/realtime/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content: initialContent,
          userId: this.userId
        })
      });

      if (!response.ok) throw new Error('Failed to create thread');

      const data = await response.json();
      const threadId = data.threadId;

      // Join the newly created thread
      await this.joinThread(threadId);

      return threadId;

    } catch (error) {
      console.error('Failed to create thread:', error);
      return null;
    }
  }

  /**
   * Apply a live suggestion
   */
  applySuggestion(suggestionId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('apply_suggestion', {
      suggestionId,
      threadId: this.currentThreadId
    });
  }

  /**
   * Polling fallback for environments without WebSocket support
   */
  private initializePollingFallback(): void {
    console.log('Initializing polling fallback for real-time features');
    
    // Poll for updates every 2 seconds
    const pollInterval = setInterval(async () => {
      if (!this.currentThreadId || !this.userId) return;

      try {
        const response = await fetch(`/api/optimail/realtime/poll?threadId=${this.currentThreadId}&userId=${this.userId}`);
        if (response.ok) {
          const updates = await response.json();
          updates.forEach((update: RealtimeMessage) => {
            this.handleRealtimeMessage(update);
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    // Store interval for cleanup
    this.pollInterval = pollInterval;
  }

  /**
   * Event handler registration methods
   */
  onMessage(handler: (message: RealtimeMessage) => void): void {
    this.onMessageHandlers.push(handler);
  }

  onSuggestion(handler: (suggestion: LiveSuggestion) => void): void {
    this.onSuggestionHandlers.push(handler);
  }

  onTyping(handler: (typing: TypingIndicator) => void): void {
    this.onTypingHandlers.push(handler);
  }

  onCollaborators(handler: (participants: ThreadParticipant[]) => void): void {
    this.onCollaboratorHandlers.push(handler);
  }

  onConnection(handler: (connected: boolean) => void): void {
    this.onConnectionHandlers.push(handler);
  }

  /**
   * Notification methods for event handlers
   */
  private notifyMessageHandlers(message: RealtimeMessage): void {
    this.onMessageHandlers.forEach(handler => handler(message));
  }

  private notifySuggestionHandlers(suggestion: LiveSuggestion): void {
    this.onSuggestionHandlers.forEach(handler => handler(suggestion));
  }

  private notifyTypingHandlers(typing: TypingIndicator): void {
    this.onTypingHandlers.forEach(handler => handler(typing));
  }

  private notifyCollaboratorHandlers(participants: ThreadParticipant[]): void {
    this.onCollaboratorHandlers.forEach(handler => handler(participants));
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.onConnectionHandlers.forEach(handler => handler(connected));
  }

  /**
   * Cleanup and disconnect
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.currentThreadId = null;
    console.log('Real-time service disconnected');
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current thread ID
   */
  get threadId(): string | null {
    return this.currentThreadId;
  }
}

export default RealtimeService;
