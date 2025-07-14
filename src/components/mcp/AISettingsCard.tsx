import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Key, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AISettings, OpenAIModel } from '@/types/mcp';

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
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');
  const { toast } = useToast();

  const testOpenAIKey = async (apiKey: string) => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      return false;
    }

    setIsTestingKey(true);
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
        setKeyStatus('valid');
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
      setKeyStatus('invalid');
      onLog(`❌ OpenAI API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', '❌');
      toast({
        title: "Invalid API Key",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsTestingKey(false);
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

  const handleApiKeyChange = (apiKey: string) => {
    onSettingsChange({ ...settings, openaiApiKey: apiKey });
    setKeyStatus('untested');
  };

  const handleTestKey = () => {
    testOpenAIKey(settings.openaiApiKey);
  };

  const getKeyStatusIcon = () => {
    switch (keyStatus) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'invalid': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Key className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const selectedModel = availableModels.find(m => m.id === settings.selectedModel);

  return (
    <Card className="bg-gradient-surface border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          AI Configuration
        </CardTitle>
        <CardDescription>
          Configure your OpenAI API key and model preferences for AI agent interactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Section */}
        <div className="space-y-3">
          <Label htmlFor="apiKey" className="text-sm font-medium">OpenAI API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={settings.openaiApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getKeyStatusIcon()}
              </div>
            </div>
            <Button 
              onClick={handleTestKey}
              disabled={isTestingKey || !settings.openaiApiKey.trim()}
              variant="outline"
              size="sm"
              className="min-w-[80px]"
            >
              {isTestingKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Test'
              )}
            </Button>
          </div>
          {keyStatus === 'valid' && (
            <Badge variant="outline" className="text-success border-success/50">
              ✓ API Key Valid
            </Badge>
          )}
        </div>

        {/* Model Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Model Selection
          </Label>
          <Select 
            value={settings.selectedModel} 
            onValueChange={(value) => onSettingsChange({ ...settings, selectedModel: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.context_window.toLocaleString()} tokens
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
                <span className="font-medium">{selectedModel.context_window.toLocaleString()} tokens</span>
              </div>
              {selectedModel.pricing && (
                <>
                  <div className="flex justify-between">
                    <span>Input Price:</span>
                    <span className="font-medium">${selectedModel.pricing.input}/1K tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output Price:</span>
                    <span className="font-medium">${selectedModel.pricing.output}/1K tokens</span>
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