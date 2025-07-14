import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AISettings } from '@/types/mcp';

const DEFAULT_SETTINGS: AISettings = {
  openaiApiKey: '',
  openrouterApiKey: '',
  provider: 'openai',
  selectedModel: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: 'You are a helpful AI assistant.',
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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
        setSettings({
          openaiApiKey: data.openai_api_key || '',
          openrouterApiKey: data.openrouter_api_key || '',
          provider: data.provider as 'openai' | 'openrouter',
          selectedModel: data.selected_model,
          temperature: data.temperature,
          maxTokens: data.max_tokens,
          systemPrompt: data.system_prompt,
        });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save settings",
          variant: "destructive",
        });
        return;
      }

      const settingsData = {
        user_id: user.id,
        openai_api_key: newSettings.openaiApiKey,
        openrouter_api_key: newSettings.openrouterApiKey,
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

      setSettings(newSettings);
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