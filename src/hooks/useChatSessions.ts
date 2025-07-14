import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/mcp';

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (title?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create chat sessions",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: user.id,
          title: title || `Chat ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      setCurrentSessionId(data.id);
      setMessages([]);
      return data;
    } catch (error) {
      console.error('Error creating chat session:', error);
      toast({
        title: "Error",
        description: "Failed to create chat session",
        variant: "destructive",
      });
      return null;
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const chatMessages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        toolCalls: msg.tool_calls as any, // Handle JSON to ToolCall[] conversion
      }));

      setMessages(chatMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  };

  const saveMessage = async (message: ChatMessage, sessionId: string, modelUsed?: string, providerUsed?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId) return;

      const { error } = await supabase
        .from('ai_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          role: message.role,
          content: message.content,
          model_used: modelUsed,
          provider_used: providerUsed,
          tool_calls: message.toolCalls as any, // Handle ToolCall[] to JSON conversion
          file_attachments: null, // For future file support
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    }
  };

  return {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    createSession,
    loadMessages,
    saveMessage,
    deleteSession,
    setMessages,
  };
};