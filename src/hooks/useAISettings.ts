import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AISettings } from '@/types/mcp';

const DEFAULT_SETTINGS: AISettings = {
  openaiApiKey: '',
  openrouterApiKey: '',
  geminiApiKey: '',
  anthropicApiKey: '',
  deepseekApiKey: '',
  perplexityApiKey: '',
  grokApiKey: '',
  provider: 'openai',
  selectedModel: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: `You are a helpful AI assistant. **For every user input:**
1. **Acknowledge** the request professionally
2. **Use relevant MCP tools** to gather current/specific information when applicable
3. **Provide comprehensive analysis** based on both tool results and your knowledge
4. **Offer additional insights** or related information that might be valuable
5. **Suggest next steps** or follow-up actions when appropriate`,
};

export const useAISettings = () => {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // First try to load from localStorage regardless of auth status
      const storedSettings = localStorage.getItem('ai_settings');
      let loadedSettings = DEFAULT_SETTINGS;
      
      if (storedSettings) {
        try {
          loadedSettings = JSON.parse(storedSettings);
          console.log('Loaded AI settings from localStorage:', loadedSettings);
        } catch (parseError) {
          console.error('Error parsing stored AI settings:', parseError);
        }
      }
      
      // Then try to load from Supabase if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no user, use the localStorage settings or defaults
        setSettings(loadedSettings);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

       if (data) {
         const supabaseSettings = {
           openaiApiKey: data.openai_api_key || '',
           openrouterApiKey: data.openrouter_api_key || '',
           geminiApiKey: data.gemini_api_key || '',
           anthropicApiKey: data.anthropic_api_key || '',
           deepseekApiKey: data.deepseek_api_key || '',
           perplexityApiKey: data.perplexity_api_key || '',
           grokApiKey: data.grok_api_key || '',
           provider: data.provider as AISettings['provider'],
           selectedModel: data.selected_model || DEFAULT_SETTINGS.selectedModel,
           temperature: data.temperature || DEFAULT_SETTINGS.temperature,
           maxTokens: data.max_tokens || DEFAULT_SETTINGS.maxTokens,
           systemPrompt: data.system_prompt || DEFAULT_SETTINGS.systemPrompt,
         };
         console.log('Loading AI settings from Supabase:', supabaseSettings);
         
         // Save to localStorage for persistence across sessions
         localStorage.setItem('ai_settings', JSON.stringify(supabaseSettings));
         
         setSettings(supabaseSettings);
       } else {
         console.log('No saved settings found in Supabase, using localStorage or defaults');
         // If no Supabase data, keep using the localStorage settings loaded earlier
       }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to load AI settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AISettings) => {
    try {
      // Always save to localStorage for persistence across sessions
      localStorage.setItem('ai_settings', JSON.stringify(newSettings));
      
      // Update local state immediately
      setSettings(newSettings);
      
      // Then try to save to Supabase if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not authenticated, still show success since we saved to localStorage
        toast({
          title: "Settings Saved",
          description: "AI settings saved locally",
        });
        return;
      }

      const settingsData = {
        user_id: user.id,
        openai_api_key: newSettings.openaiApiKey,
        openrouter_api_key: newSettings.openrouterApiKey,
        gemini_api_key: newSettings.geminiApiKey,
        anthropic_api_key: newSettings.anthropicApiKey,
        deepseek_api_key: newSettings.deepseekApiKey,
        perplexity_api_key: newSettings.perplexityApiKey,
        grok_api_key: newSettings.grokApiKey,
        provider: newSettings.provider,
        selected_model: newSettings.selectedModel,
        temperature: newSettings.temperature,
        max_tokens: newSettings.maxTokens,
        system_prompt: newSettings.systemPrompt,
      };

      const { error } = await supabase
        .from('ai_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "AI settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive",
      });
    }
  };

  return {
    settings,
    isLoading,
    saveSettings,
    setSettings,
  };
};