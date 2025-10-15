import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export const conversationService = {
  // Create a new conversation
  async createConversation(
    userId: string,
    module: ConversationInsert['module'],
    title: string
  ): Promise<ConversationRow> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        module,
        title,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's conversations for a specific module
  async getUserConversations(
    userId: string,
    module?: ConversationInsert['module']
  ): Promise<ConversationRow[]> {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (module) {
      query = query.eq('module', module);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get a specific conversation with messages
  async getConversationWithMessages(conversationId: string): Promise<{
    conversation: ConversationRow;
    messages: MessageRow[];
  }> {
    const [conversationResult, messagesResult] = await Promise.all([
      supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single(),
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
    ]);

    if (conversationResult.error) throw conversationResult.error;
    if (messagesResult.error) throw messagesResult.error;

    return {
      conversation: conversationResult.data,
      messages: messagesResult.data || []
    };
  },

  // Add a message to a conversation
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<MessageRow> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  },

  // Update conversation title
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) throw error;
  },

  // Delete a conversation and all its messages
  async deleteConversation(conversationId: string): Promise<void> {
    // First delete all messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) throw messagesError;

    // Then delete the conversation
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (conversationError) throw conversationError;
  },

  // Get recent messages across all conversations for a user
  async getRecentMessages(userId: string, limit: number = 50): Promise<Array<MessageRow & { conversation: ConversationRow }>> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        conversation:conversations(*)
      `)
      .eq('conversations.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Search messages by content
  async searchMessages(userId: string, query: string): Promise<Array<MessageRow & { conversation: ConversationRow }>> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        conversation:conversations(*)
      `)
      .eq('conversations.user_id', userId)
      .textSearch('content', query)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
