-- Veritas SynapseCore — idempotent schema for the OpenShip self-hosted Supabase (homelab).
-- Safe to run repeatedly. Applies: ai_settings, ai_chat_sessions, ai_chat_messages,
-- mcp_servers, the ai-chat-files storage bucket, and all RLS policies/triggers.
--
-- Apply with:
--   cat supabase/selfhost/schema.sql | ssh root@192.168.1.42 \
--     'docker exec -i openship-supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1'

-- Shared updated_at trigger function --------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ai_settings ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  selected_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  openai_api_key TEXT,
  openrouter_api_key TEXT,
  temperature DECIMAL(2,1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  system_prompt TEXT DEFAULT 'You are a helpful AI assistant.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS perplexity_api_key TEXT;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS grok_api_key TEXT;

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI settings" ON public.ai_settings;
CREATE POLICY "Users can view their own AI settings" ON public.ai_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own AI settings" ON public.ai_settings;
CREATE POLICY "Users can create their own AI settings" ON public.ai_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own AI settings" ON public.ai_settings;
CREATE POLICY "Users can update their own AI settings" ON public.ai_settings FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ai_chat_sessions -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can view their own chat sessions" ON public.ai_chat_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can create their own chat sessions" ON public.ai_chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can update their own chat sessions" ON public.ai_chat_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can delete their own chat sessions" ON public.ai_chat_sessions FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ai_chat_sessions_updated_at ON public.ai_chat_sessions;
CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON public.ai_chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ai_chat_messages -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  provider_used TEXT,
  tool_calls JSONB,
  file_attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.ai_chat_messages;
CREATE POLICY "Users can view their own chat messages" ON public.ai_chat_messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own chat messages" ON public.ai_chat_messages;
CREATE POLICY "Users can create their own chat messages" ON public.ai_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON public.ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON public.ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);

-- mcp_servers ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mcp_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  tools JSONB DEFAULT '[]'::jsonb,
  last_connected TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own MCP servers" ON public.mcp_servers;
CREATE POLICY "Users can view their own MCP servers" ON public.mcp_servers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own MCP servers" ON public.mcp_servers;
CREATE POLICY "Users can create their own MCP servers" ON public.mcp_servers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own MCP servers" ON public.mcp_servers;
CREATE POLICY "Users can update their own MCP servers" ON public.mcp_servers FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own MCP servers" ON public.mcp_servers;
CREATE POLICY "Users can delete their own MCP servers" ON public.mcp_servers FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_mcp_servers_updated_at ON public.mcp_servers;
CREATE TRIGGER update_mcp_servers_updated_at BEFORE UPDATE ON public.mcp_servers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage: ai-chat-files bucket ------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-chat-files', 'ai-chat-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can view their own AI chat files" ON storage.objects;
CREATE POLICY "Users can view their own AI chat files" ON storage.objects FOR SELECT
USING (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can upload their own AI chat files" ON storage.objects;
CREATE POLICY "Users can upload their own AI chat files" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can delete their own AI chat files" ON storage.objects;
CREATE POLICY "Users can delete their own AI chat files" ON storage.objects FOR DELETE
USING (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
