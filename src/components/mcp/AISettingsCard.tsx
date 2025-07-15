import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Check, X, AlertCircle, Eye, EyeOff, Settings } from 'lucide-react';
import { AISettings, OpenAIModel, OpenRouterModel } from '@/types/mcp';
import { useToast } from '@/hooks/use-toast';

interface AISettingsCardProps {
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error', icon: string, source?: string) => void;
}

// Model definitions for each provider
const DEFAULT_OPENAI_MODELS: OpenAIModel[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context_window: 128000, pricing: { input: 0.15, output: 0.6 } },
  { id: 'gpt-4o', name: 'GPT-4o', context_window: 128000, pricing: { input: 5, output: 15 } },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', context_window: 128000, pricing: { input: 10, output: 30 } },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context_window: 16385, pricing: { input: 0.5, output: 1.5 } },
];

const DEFAULT_OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', context_length: 128000, pricing: { prompt: 0.15, completion: 0.6 } },
  { id: 'openai/gpt-4o', name: 'GPT-4o', context_length: 128000, pricing: { prompt: 5, completion: 15 } },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', context_length: 200000, pricing: { prompt: 3, completion: 15 } },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', context_length: 131072, pricing: { prompt: 2.7, completion: 2.7 } },
];

const GEMINI_MODELS = [
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context_length: 2097152 },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', context_length: 1048576 },
  { id: 'gemini-pro', name: 'Gemini Pro', context_length: 32768 },
];

const ANTHROPIC_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', context_length: 200000 },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', context_length: 200000 },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', context_length: 200000 },
];

const DEEPSEEK_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek Chat', context_length: 32768 },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', context_length: 16384 },
];

const PERPLEXITY_MODELS = [
  { id: 'llama-3.1-sonar-small-128k-online', name: 'Llama 3.1 Sonar Small (Online)', context_length: 127072 },
  { id: 'llama-3.1-sonar-large-128k-online', name: 'Llama 3.1 Sonar Large (Online)', context_length: 127072 },
  { id: 'llama-3.1-sonar-huge-128k-online', name: 'Llama 3.1 Sonar Huge (Online)', context_length: 127072 },
];

const GROK_MODELS = [
  { id: 'grok-beta', name: 'Grok Beta', context_length: 131072 },
  { id: 'grok-vision-beta', name: 'Grok Vision Beta', context_length: 8192 },
];

export const AISettingsCard = ({ settings, onSettingsChange, onLog }: AISettingsCardProps) => {
  const [openaiModels, setOpenaiModels] = useState<OpenAIModel[]>(DEFAULT_OPENAI_MODELS);
  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModel[]>(DEFAULT_OPENROUTER_MODELS);
  const [apiKeyStatuses, setApiKeyStatuses] = useState<Record<string, 'valid' | 'invalid' | 'testing' | null>>({
    openai: null,
    openrouter: null,
    gemini: null,
    anthropic: null,
    deepseek: null,
    perplexity: null,
    grok: null,
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    openai: false,
    openrouter: false,
    gemini: false,
    anthropic: false,
    deepseek: false,
    perplexity: false,
    grok: false,
  });
  const { toast } = useToast();

  const testOpenAIKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey.trim()) return false;
    
    setApiKeyStatuses(prev => ({ ...prev, openai: 'testing' }));
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.data
          .filter((model: any) => model.id.includes('gpt'))
          .map((model: any) => ({
            id: model.id,
            name: model.id.toUpperCase(),
            context_window: model.context_window || 4096,
          }));
        
        if (models.length > 0) {
          setOpenaiModels([...DEFAULT_OPENAI_MODELS, ...models.filter((m: any) => 
            !DEFAULT_OPENAI_MODELS.find(dm => dm.id === m.id)
          )]);
        }
        
        setApiKeyStatuses(prev => ({ ...prev, openai: 'valid' }));
        onLog('OpenAI API key validated successfully', 'success', '✅');
        return true;
      } else {
        setApiKeyStatuses(prev => ({ ...prev, openai: 'invalid' }));
        onLog('Invalid OpenAI API key', 'error', '❌');
        return false;
      }
    } catch (error) {
      setApiKeyStatuses(prev => ({ ...prev, openai: 'invalid' }));
      onLog('Failed to validate OpenAI API key', 'error', '❌');
      return false;
    }
  };

  const testApiKey = async (provider: string, apiKey: string): Promise<boolean> => {
    if (!apiKey.trim()) return false;
    
    setApiKeyStatuses(prev => ({ ...prev, [provider]: 'testing' }));
    
    try {
      let isValid = false;
      
      // Simple validation - just check if key has reasonable format
      switch (provider) {
        case 'openrouter':
          isValid = apiKey.startsWith('sk-or-') && apiKey.length > 20;
          break;
        case 'gemini':
          isValid = apiKey.length > 20; // Google API keys are typically long
          break;
        case 'anthropic':
          isValid = apiKey.startsWith('sk-ant-') && apiKey.length > 20;
          break;
        case 'deepseek':
          isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
          break;
        case 'perplexity':
          isValid = apiKey.startsWith('pplx-') && apiKey.length > 20;
          break;
        case 'grok':
          isValid = apiKey.length > 20; // X.AI API keys
          break;
        default:
          isValid = apiKey.length > 10;
      }
      
      setApiKeyStatuses(prev => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }));
      onLog(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key ${isValid ? 'validated' : 'invalid'}`, isValid ? 'success' : 'error', isValid ? '✅' : '❌');
      return isValid;
    } catch (error) {
      setApiKeyStatuses(prev => ({ ...prev, [provider]: 'invalid' }));
      onLog(`Failed to validate ${provider} API key`, 'error', '❌');
      return false;
    }
  };

  const handleApiKeyChange = (provider: string, apiKey: string) => {
    const newSettings = { ...settings };
    switch (provider) {
      case 'openai':
        newSettings.openaiApiKey = apiKey;
        break;
      case 'openrouter':
        newSettings.openrouterApiKey = apiKey;
        break;
      case 'gemini':
        newSettings.geminiApiKey = apiKey;
        break;
      case 'anthropic':
        newSettings.anthropicApiKey = apiKey;
        break;
      case 'deepseek':
        newSettings.deepseekApiKey = apiKey;
        break;
      case 'perplexity':
        newSettings.perplexityApiKey = apiKey;
        break;
      case 'grok':
        newSettings.grokApiKey = apiKey;
        break;
    }
    onSettingsChange(newSettings);
    // Reset status when key changes
    setApiKeyStatuses(prev => ({ ...prev, [provider]: null }));
  };

  const handleConnect = async (provider: string) => {
    const apiKey = getApiKey(provider);
    if (!apiKey) return;

    let isValid = false;
    if (provider === 'openai') {
      isValid = await testOpenAIKey(apiKey);
    } else {
      isValid = await testApiKey(provider, apiKey);
    }

    if (isValid) {
      const newSettings = { ...settings, provider: provider as AISettings['provider'] };
      onSettingsChange(newSettings);
      toast({
        title: "Connected!",
        description: `Successfully connected to ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
      });
    }
  };

  const getApiKey = (provider: string): string => {
    switch (provider) {
      case 'openai': return settings.openaiApiKey;
      case 'openrouter': return settings.openrouterApiKey;
      case 'gemini': return settings.geminiApiKey;
      case 'anthropic': return settings.anthropicApiKey;
      case 'deepseek': return settings.deepseekApiKey;
      case 'perplexity': return settings.perplexityApiKey;
      case 'grok': return settings.grokApiKey;
      default: return '';
    }
  };

  const getModelsForProvider = (provider: string) => {
    switch (provider) {
      case 'openai': return openaiModels;
      case 'openrouter': return openrouterModels;
      case 'gemini': return GEMINI_MODELS;
      case 'anthropic': return ANTHROPIC_MODELS;
      case 'deepseek': return DEEPSEEK_MODELS;
      case 'perplexity': return PERPLEXITY_MODELS;
      case 'grok': return GROK_MODELS;
      default: return [];
    }
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const renderProviderTab = (provider: string, displayName: string) => {
    const apiKey = getApiKey(provider);
    const status = apiKeyStatuses[provider];
    const models = getModelsForProvider(provider);
    const isSelected = settings.provider === provider;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${provider}-key`}>API Key</Label>
          <div className="relative">
            <Input
              id={`${provider}-key`}
              type={showKeys[provider] ? "text" : "password"}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(provider, e.target.value)}
              placeholder={`Enter your ${displayName} API key`}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleKeyVisibility(provider)}
                className="h-6 w-6 p-0"
              >
                {showKeys[provider] ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
              {status === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'valid' && <Check className="h-4 w-4 text-green-500" />}
              {status === 'invalid' && <X className="h-4 w-4 text-red-500" />}
            </div>
          </div>
        </div>

        <Button 
          onClick={() => handleConnect(provider)}
          disabled={!apiKey || status === 'testing'}
          className="w-full"
          variant={isSelected ? "default" : "outline"}
        >
          {status === 'testing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSelected ? `Connected to ${displayName}` : `Connect to ${displayName}`}
        </Button>

        {status === 'valid' && models.length > 0 && (
          <div className="space-y-2">
            <Label>Available Models</Label>
            <div className="grid gap-2 max-h-32 overflow-y-auto">
              {models.map((model) => (
                <div key={model.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{model.name}</span>
                  <Badge variant="outline">
                    {('context_window' in model ? model.context_window : model.context_length)?.toLocaleString()} tokens
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-surface border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          AI Provider Settings
          {settings.provider && (
            <Badge variant="default">
              {settings.provider.charAt(0).toUpperCase() + settings.provider.slice(1)}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure your AI provider API keys and model settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={settings.provider || "openai"} onValueChange={(value) => onSettingsChange({ ...settings, provider: value as AISettings['provider'] })} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
            <TabsTrigger value="gemini">Gemini</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
            <TabsTrigger value="perplexity">Perplexity</TabsTrigger>
            <TabsTrigger value="grok">Grok</TabsTrigger>
          </TabsList>

          <TabsContent value="openai">
            {renderProviderTab('openai', 'OpenAI')}
          </TabsContent>

          <TabsContent value="openrouter">
            {renderProviderTab('openrouter', 'OpenRouter')}
          </TabsContent>

          <TabsContent value="gemini">
            {renderProviderTab('gemini', 'Google Gemini')}
          </TabsContent>

          <TabsContent value="anthropic">
            {renderProviderTab('anthropic', 'Anthropic')}
          </TabsContent>

          <TabsContent value="deepseek">
            {renderProviderTab('deepseek', 'DeepSeek')}
          </TabsContent>

          <TabsContent value="perplexity">
            {renderProviderTab('perplexity', 'Perplexity')}
          </TabsContent>

          <TabsContent value="grok">
            {renderProviderTab('grok', 'Grok (X.AI)')}
          </TabsContent>
        </Tabs>

        {settings.provider && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="model-select">Model</Label>
              <Select value={settings.selectedModel} onValueChange={(value) => onSettingsChange({ ...settings, selectedModel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {getModelsForProvider(settings.provider).map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {('context_window' in model ? model.context_window : model.context_length)?.toLocaleString()} tokens
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temperature: {settings.temperature}</Label>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => onSettingsChange({ ...settings, temperature: value })}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Tokens: {settings.maxTokens}</Label>
              <Slider
                value={[settings.maxTokens]}
                onValueChange={([value]) => onSettingsChange({ ...settings, maxTokens: value })}
                max={4000}
                min={100}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                value={settings.systemPrompt}
                onChange={(e) => onSettingsChange({ ...settings, systemPrompt: e.target.value })}
                placeholder="Enter system prompt..."
                rows={4}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};