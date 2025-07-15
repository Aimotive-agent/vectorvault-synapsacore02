-- Add new API key columns to ai_settings table
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT,
ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT,
ADD COLUMN IF NOT EXISTS perplexity_api_key TEXT,
ADD COLUMN IF NOT EXISTS grok_api_key TEXT;