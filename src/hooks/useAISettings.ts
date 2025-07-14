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
         const loadedSettings = {
           openaiApiKey: data.openai_api_key || '',
           openrouterApiKey: data.openrouter_api_key || '',
           provider: data.provider as 'openai' | 'openrouter',
           selectedModel: data.selected_model || DEFAULT_SETTINGS.selectedModel,
           temperature: data.temperature || DEFAULT_SETTINGS.temperature,
           maxTokens: data.max_tokens || DEFAULT_SETTINGS.maxTokens,
           systemPrompt: data.system_prompt || DEFAULT_SETTINGS.systemPrompt,
         };
         console.log('Loading AI settings:', loadedSettings);
         setSettings(loadedSettings);
       } else {
         console.log('No saved settings found, using defaults');
         setSettings(DEFAULT_SETTINGS);
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

      // Update local state immediately after successful save
      setSettings(newSettings);
      
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