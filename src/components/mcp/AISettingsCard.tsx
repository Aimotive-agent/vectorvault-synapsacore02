import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Key, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AISettings, OpenAIModel, OpenRouterModel } from '@/types/mcp';

interface AISettingsCardProps {
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error', icon: string) => void;
}

const DEFAULT_MODELS: OpenAIModel[] = [
  { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
  { id: 'gpt-4', name: 'GPT-4', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context_window: 16385, pricing: { input: 0.001, output: 0.002 } },
  { id: 'gpt-4o', name: 'GPT-4o', context_window: 128000, pricing: { input: 0.005, output: 0.015 } },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context_window: 128000, pricing: { input: 0.00015, output: 0.0006 } },
];

export const AISettingsCard = ({ settings, onSettingsChange, onLog }: AISettingsCardProps) => {
  const [availableModels, setAvailableModels] = useState<OpenAIModel[]>(DEFAULT_MODELS);
  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModel[]>([]);
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const [isTestingOpenRouter, setIsTestingOpenRouter] = useState(false);
  const [openaiKeyStatus, setOpenaiKeyStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');
  const [openrouterKeyStatus, setOpenrouterKeyStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');
  const { toast } = useToast();

  // Debug log to see what's happening with settings
  useEffect(() => {
    console.log('AISettingsCard settings updated:', {
      provider: settings.provider,
      selectedModel: settings.selectedModel,
      hasOpenAI: !!settings.openaiApiKey,
      hasOpenRouter: !!settings.openrouterApiKey
    });
  }, [settings]);

  // Effect to save settings when they change
  useEffect(() => {
    // Auto-save settings when they change
    const saveTimeout = setTimeout(() => {
      // This will trigger the parent to save the settings
    }, 500);
    
    return () => clearTimeout(saveTimeout);
  }, [settings]);

  const testOpenAIKey = async (apiKey: string) => {
    if (!apiKey?.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      return false;
    }

    setIsTestingOpenAI(true);
    onLog('🔑 Testing OpenAI API key...', 'info', '🔑');

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
            name: model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            context_window: getContextWindow(model.id),
            pricing: getPricing(model.id)
          }));

        setAvailableModels(models.length > 0 ? models : DEFAULT_MODELS);
        setOpenaiKeyStatus('valid');
        onLog('✅ OpenAI API key validated successfully', 'success', '✅');
        toast({
          title: "API Key Valid",
          description: `Found ${models.length} available models`,
        });
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setOpenaiKeyStatus('invalid');
      onLog(`❌ OpenAI API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', '❌');
      toast({
        title: "Invalid API Key",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  const testOpenRouterKey = async (apiKey: string) => {
    if (!apiKey?.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenRouter API key",
        variant: "destructive"
      });
      return false;
    }

    setIsTestingOpenRouter(true);
    onLog('🔑 Testing OpenRouter API key...', 'info', '🔑');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const models: OpenRouterModel[] = data.data
          .filter((model: any) => !model.id.includes('instruct') && !model.id.includes('vision'))
          .slice(0, 20) // Limit to first 20 models for better UX
          .map((model: any) => ({
            id: model.id,
            name: model.name || model.id,
            context_length: model.context_length || 4096,
            pricing: model.pricing ? {
              prompt: parseFloat(model.pricing.prompt) || 0,
              completion: parseFloat(model.pricing.completion) || 0
            } : undefined
          }));

        setOpenrouterModels(models);
        setOpenrouterKeyStatus('valid');
        onLog('✅ OpenRouter API key validated successfully', 'success', '✅');
        toast({
          title: "API Key Valid",
          description: `Found ${models.length} available models`,
        });
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setOpenrouterKeyStatus('invalid');
      onLog(`❌ OpenRouter API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', '❌');
      toast({
        title: "Invalid API Key",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsTestingOpenRouter(false);
    }
  };

  const getContextWindow = (modelId: string): number => {
    if (modelId.includes('gpt-4o')) return 128000;
    if (modelId.includes('gpt-4-turbo')) return 128000;
    if (modelId.includes('gpt-4')) return 8192;
    if (modelId.includes('gpt-3.5')) return 16385;
    return 4096;
  };

  const getPricing = (modelId: string) => {
    const pricingMap: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
    };
    return pricingMap[modelId] || { input: 0, output: 0 };
  };

  const handleOpenAIApiKeyChange = (apiKey: string) => {
    const updatedSettings = { ...settings, openaiApiKey: apiKey };
    onSettingsChange(updatedSettings);
    setOpenaiKeyStatus('untested');
  };

  const handleOpenRouterApiKeyChange = (apiKey: string) => {
    const updatedSettings = { ...settings, openrouterApiKey: apiKey };
    onSettingsChange(updatedSettings);
    setOpenrouterKeyStatus('untested');
  };

  const handleModelChange = (modelId: string) => {
    const updatedSettings = { ...settings, selectedModel: modelId };
    onSettingsChange(updatedSettings);
  };

  const handleProviderChange = (provider: 'openai' | 'openrouter') => {
    const updatedSettings = { ...settings, provider };
    onSettingsChange(updatedSettings);
  };

  const handleTestOpenAIKey = () => {
    testOpenAIKey(settings.openaiApiKey);
  };

  const handleTestOpenRouterKey = () => {
    testOpenRouterKey(settings.openrouterApiKey);
  };

  const getKeyStatusIcon = (status: 'untested' | 'valid' | 'invalid') => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'invalid': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Key className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCurrentModels = () => {
    return settings.provider === 'openrouter' ? openrouterModels : availableModels;
  };

  const selectedModel = getCurrentModels().find(m => m.id === settings.selectedModel);

  return (
    <Card className="bg-gradient-surface border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          AI Configuration
        </CardTitle>
        <CardDescription>
          Configure your AI provider and model preferences for AI agent interactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">AI Provider</Label>
          <Tabs value={settings.provider} onValueChange={handleProviderChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
            </TabsList>
            
            <TabsContent value="openai" className="space-y-4 mt-4">
              {/* OpenAI API Key */}
              <div className="space-y-3">
                <Label htmlFor="openaiApiKey" className="text-sm font-medium">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openaiApiKey"
                      type="password"
                      placeholder="sk-..."
                      value={settings.openaiApiKey}
                      onChange={(e) => handleOpenAIApiKeyChange(e.target.value)}
                      className="pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getKeyStatusIcon(openaiKeyStatus)}
                    </div>
                  </div>
                  <Button 
                    onClick={handleTestOpenAIKey}
                    disabled={isTestingOpenAI || !settings.openaiApiKey?.trim()}
                    variant="outline"
                    size="sm"
                    className="min-w-[80px]"
                  >
                    {isTestingOpenAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                {openaiKeyStatus === 'valid' && (
                  <Badge variant="outline" className="text-success border-success/50">
                    ✓ API Key Valid
                  </Badge>
                )}
              </div>
            </TabsContent>

            <TabsContent value="openrouter" className="space-y-4 mt-4">
              {/* OpenRouter API Key */}
              <div className="space-y-3">
                <Label htmlFor="openrouterApiKey" className="text-sm font-medium">OpenRouter API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openrouterApiKey"
                      type="password"
                      placeholder="sk-or-..."
                      value={settings.openrouterApiKey}
                      onChange={(e) => handleOpenRouterApiKeyChange(e.target.value)}
                      className="pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getKeyStatusIcon(openrouterKeyStatus)}
                    </div>
                  </div>
                  <Button 
                    onClick={handleTestOpenRouterKey}
                    disabled={isTestingOpenRouter || !settings.openrouterApiKey?.trim()}
                    variant="outline"
                    size="sm"
                    className="min-w-[80px]"
                  >
                    {isTestingOpenRouter ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                {openrouterKeyStatus === 'valid' && (
                  <Badge variant="outline" className="text-success border-success/50">
                    ✓ API Key Valid
                  </Badge>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Model Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Model Selection
          </Label>
          <Select 
            value={settings.selectedModel || ''} 
            onValueChange={handleModelChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {getCurrentModels().map((model: any) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(model.context_window || model.context_length)?.toLocaleString()} tokens
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
           {selectedModel && (
            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span>Context Window:</span>
                <span className="font-medium">{((selectedModel as any).context_window || (selectedModel as any).context_length)?.toLocaleString()} tokens</span>
              </div>
              {(selectedModel as any).pricing && (
                <>
                  <div className="flex justify-between">
                    <span>Input Price:</span>
                    <span className="font-medium">
                      ${settings.provider === 'openrouter' 
                        ? (selectedModel as any).pricing.prompt 
                        : (selectedModel as any).pricing.input}/1K tokens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output Price:</span>
                    <span className="font-medium">
                      ${settings.provider === 'openrouter' 
                        ? (selectedModel as any).pricing.completion 
                        : (selectedModel as any).pricing.output}/1K tokens
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Temperature */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Temperature: {settings.temperature}</Label>
          <Slider
            value={[settings.temperature]}
            onValueChange={([value]) => onSettingsChange({ ...settings, temperature: value })}
            max={2}
            min={0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Focused</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Max Tokens: {settings.maxTokens}</Label>
          <Slider
            value={[settings.maxTokens]}
            onValueChange={([value]) => onSettingsChange({ ...settings, maxTokens: value })}
            max={4000}
            min={100}
            step={100}
            className="w-full"
          />
        </div>

        {/* System Prompt */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">System Prompt</Label>
          <Textarea
            placeholder="You are a helpful AI assistant with access to MCP tools..."
            value={settings.systemPrompt}
            onChange={(e) => onSettingsChange({ ...settings, systemPrompt: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};