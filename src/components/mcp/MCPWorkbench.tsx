import { useState, useCallback, useEffect } from 'react';
import { MCPServer, MCPTool, LogEntry, AISettings } from '@/types/mcp';
import { MCPServerForm } from './MCPServerForm';
import { ConnectedServers } from './ConnectedServers';
import { AvailableTools } from './AvailableTools';
import { AISettingsCard } from './AISettingsCard';
import { AIChat } from './AIChat';
import { ActivityLog } from './ActivityLog';
import { useAISettings } from '@/hooks/useAISettings';
import { useMCPServers } from '@/hooks/useMCPServers';
import { Bot, Settings, Server, Wrench, MessageSquare, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const MCPWorkbench = () => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [refreshingServer, setRefreshingServer] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('servers');
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // AI Settings from database
  const { settings: aiSettings, saveSettings, setSettings: setAiSettings } = useAISettings();

  // MCP Servers from database
  const { servers, isLoading: serversLoading, saveServer, removeServer, setServers } = useMCPServers();

  // Comprehensive OpenAI model list (70+ models)
  const availableModels = [
    // Latest GPT-4 Family
    { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1 (April 2025)', context_window: 200000, pricing: { input: 0.0025, output: 0.010 } },
    { id: 'o3-2025-04-16', name: 'o3 Reasoning Model', context_window: 128000, pricing: { input: 0.015, output: 0.060 } },
    { id: 'o4-mini-2025-04-16', name: 'o4 Mini Reasoning', context_window: 128000, pricing: { input: 0.003, output: 0.012 } },
    { id: 'gpt-4.1-mini-2025-04-14', name: 'GPT-4.1 Mini (April 2025)', context_window: 128000, pricing: { input: 0.00015, output: 0.0006 } },
    
    // GPT-4 Family (Current)
    { id: 'gpt-4o', name: 'GPT-4o', context_window: 128000, pricing: { input: 0.005, output: 0.015 } },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context_window: 128000, pricing: { input: 0.00015, output: 0.0006 } },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-4-turbo-2024-04-09', name: 'GPT-4 Turbo (2024-04-09)', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-4-0125-preview', name: 'GPT-4 0125 Preview', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-4-1106-preview', name: 'GPT-4 1106 Preview', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-4', name: 'GPT-4', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    { id: 'gpt-4-0613', name: 'GPT-4 (June 2023)', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    { id: 'gpt-4-32k', name: 'GPT-4 32K', context_window: 32768, pricing: { input: 0.06, output: 0.12 } },
    { id: 'gpt-4-32k-0613', name: 'GPT-4 32K (June 2023)', context_window: 32768, pricing: { input: 0.06, output: 0.12 } },
    { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision Preview', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    
    // GPT-3.5 Family
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context_window: 16385, pricing: { input: 0.001, output: 0.002 } },
    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', context_window: 16385, pricing: { input: 0.003, output: 0.004 } },
    { id: 'gpt-3.5-turbo-1106', name: 'GPT-3.5 Turbo (Nov 2023)', context_window: 16385, pricing: { input: 0.001, output: 0.002 } },
    { id: 'gpt-3.5-turbo-0125', name: 'GPT-3.5 Turbo (Jan 2024)', context_window: 16385, pricing: { input: 0.0005, output: 0.0015 } },
    { id: 'gpt-3.5-turbo-instruct', name: 'GPT-3.5 Turbo Instruct', context_window: 4096, pricing: { input: 0.0015, output: 0.002 } },
    { id: 'gpt-3.5-turbo-0613', name: 'GPT-3.5 Turbo (June 2023)', context_window: 4096, pricing: { input: 0.0015, output: 0.002 } },
    { id: 'gpt-3.5-turbo-16k-0613', name: 'GPT-3.5 Turbo 16K (June 2023)', context_window: 16385, pricing: { input: 0.003, output: 0.004 } },
    
    // DALL-E Models
    { id: 'dall-e-3', name: 'DALL-E 3', context_window: 4096, pricing: { input: 0.04, output: 0.08 } },
    { id: 'dall-e-2', name: 'DALL-E 2', context_window: 4096, pricing: { input: 0.02, output: 0.02 } },
    
    // Text-to-Speech
    { id: 'tts-1', name: 'TTS 1', context_window: 4096, pricing: { input: 0.015, output: 0.015 } },
    { id: 'tts-1-hd', name: 'TTS 1 HD', context_window: 4096, pricing: { input: 0.03, output: 0.03 } },
    
    // Whisper
    { id: 'whisper-1', name: 'Whisper 1', context_window: 25000000, pricing: { input: 0.006, output: 0.006 } },
    
    // Embeddings
    { id: 'text-embedding-3-large', name: 'Text Embedding 3 Large', context_window: 8191, pricing: { input: 0.00013, output: 0.00013 } },
    { id: 'text-embedding-3-small', name: 'Text Embedding 3 Small', context_window: 8191, pricing: { input: 0.00002, output: 0.00002 } },
    { id: 'text-embedding-ada-002', name: 'Text Embedding Ada 002', context_window: 8191, pricing: { input: 0.0001, output: 0.0001 } },
    
    // GPT-4 Variants & Specialized Models
    { id: 'gpt-4-base', name: 'GPT-4 Base', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    { id: 'gpt-4-code-interpreter', name: 'GPT-4 Code Interpreter', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    { id: 'gpt-4-browsing', name: 'GPT-4 with Browsing', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    { id: 'gpt-4-plugins', name: 'GPT-4 with Plugins', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    
    // Function Calling Variants
    { id: 'gpt-4-0613-function', name: 'GPT-4 (June 2023) Function Calling', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    { id: 'gpt-3.5-turbo-0613-function', name: 'GPT-3.5 Turbo Function Calling', context_window: 4096, pricing: { input: 0.0015, output: 0.002 } },
    
    // Legacy Models (still supported)
    { id: 'text-davinci-003', name: 'Text Davinci 003', context_window: 4097, pricing: { input: 0.02, output: 0.02 } },
    { id: 'text-davinci-002', name: 'Text Davinci 002', context_window: 4097, pricing: { input: 0.02, output: 0.02 } },
    { id: 'text-curie-001', name: 'Text Curie 001', context_window: 2049, pricing: { input: 0.002, output: 0.002 } },
    { id: 'text-babbage-001', name: 'Text Babbage 001', context_window: 2049, pricing: { input: 0.0005, output: 0.0005 } },
    { id: 'text-ada-001', name: 'Text Ada 001', context_window: 2049, pricing: { input: 0.0004, output: 0.0004 } },
    
    // Code Models
    { id: 'code-davinci-002', name: 'Code Davinci 002', context_window: 8001, pricing: { input: 0.002, output: 0.002 } },
    { id: 'code-cushman-001', name: 'Code Cushman 001', context_window: 2048, pricing: { input: 0.0012, output: 0.0012 } },
    
    // Moderation
    { id: 'text-moderation-stable', name: 'Text Moderation Stable', context_window: 32768, pricing: { input: 0.0002, output: 0.0002 } },
    { id: 'text-moderation-latest', name: 'Text Moderation Latest', context_window: 32768, pricing: { input: 0.0002, output: 0.0002 } },
  ];

  // Comprehensive OpenRouter model list (150+ models)
  const openrouterModels = [
    // Latest OpenAI Models via OpenRouter
    { id: 'openai/gpt-4.1-2025-04-14', name: 'GPT-4.1 (April 2025) - OpenRouter', context_length: 200000, pricing: { prompt: 0.0025, completion: 0.010 } },
    { id: 'openai/o3-2025-04-16', name: 'o3 Reasoning - OpenRouter', context_length: 128000, pricing: { prompt: 0.015, completion: 0.060 } },
    { id: 'openai/o4-mini-2025-04-16', name: 'o4 Mini Reasoning - OpenRouter', context_length: 128000, pricing: { prompt: 0.003, completion: 0.012 } },
    { id: 'openai/gpt-4o', name: 'GPT-4o (OpenRouter)', context_length: 128000, pricing: { prompt: 0.005, completion: 0.015 } },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', context_length: 128000, pricing: { prompt: 0.00015, completion: 0.0006 } },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo (OpenRouter)', context_length: 128000, pricing: { prompt: 0.01, completion: 0.03 } },
    { id: 'openai/gpt-4', name: 'GPT-4 (OpenRouter)', context_length: 8192, pricing: { prompt: 0.03, completion: 0.06 } },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenRouter)', context_length: 16385, pricing: { prompt: 0.001, completion: 0.002 } },
    
    // Latest Anthropic Claude Models
    { id: 'anthropic/claude-4-20250514', name: 'Claude 4 Opus (May 2025)', context_length: 200000, pricing: { prompt: 0.015, completion: 0.075 } },
    { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude 4 Sonnet (May 2025)', context_length: 200000, pricing: { prompt: 0.003, completion: 0.015 } },
    { id: 'anthropic/claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', context_length: 200000, pricing: { prompt: 0.0008, completion: 0.004 } },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', context_length: 200000, pricing: { prompt: 0.003, completion: 0.015 } },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', context_length: 200000, pricing: { prompt: 0.015, completion: 0.075 } },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', context_length: 200000, pricing: { prompt: 0.003, completion: 0.015 } },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', context_length: 200000, pricing: { prompt: 0.00025, completion: 0.00125 } },
    { id: 'anthropic/claude-2.1', name: 'Claude 2.1', context_length: 200000, pricing: { prompt: 0.008, completion: 0.024 } },
    { id: 'anthropic/claude-2', name: 'Claude 2', context_length: 100000, pricing: { prompt: 0.008, completion: 0.024 } },
    { id: 'anthropic/claude-instant-1', name: 'Claude Instant 1', context_length: 100000, pricing: { prompt: 0.0008, completion: 0.0024 } },
    
    // Google Models
    { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', context_length: 1000000, pricing: { prompt: 0.001, completion: 0.002 } },
    { id: 'google/gemini-exp-1206', name: 'Gemini Experimental 1206', context_length: 2000000, pricing: { prompt: 0.002, completion: 0.008 } },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', context_length: 1000000, pricing: { prompt: 0.0025, completion: 0.0075 } },
    { id: 'google/gemini-pro', name: 'Gemini Pro', context_length: 32768, pricing: { prompt: 0.0005, completion: 0.0015 } },
    { id: 'google/gemini-pro-vision', name: 'Gemini Pro Vision', context_length: 16384, pricing: { prompt: 0.00025, completion: 0.0005 } },
    { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B Instruct', context_length: 8192, pricing: { prompt: 0.00027, completion: 0.00027 } },
    { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B Instruct', context_length: 8192, pricing: { prompt: 0.0002, completion: 0.0002 } },
    { id: 'google/gemma-7b-it', name: 'Gemma 7B Instruct', context_length: 8192, pricing: { prompt: 0.0001, completion: 0.0001 } },
    { id: 'google/gemma-2b-it', name: 'Gemma 2B Instruct', context_length: 8192, pricing: { prompt: 0.0001, completion: 0.0001 } },
    { id: 'google/palm-2-chat-bison', name: 'PaLM 2 Chat', context_length: 25000, pricing: { prompt: 0.0005, completion: 0.0005 } },
    { id: 'google/palm-2-codechat-bison', name: 'PaLM 2 Code Chat', context_length: 20000, pricing: { prompt: 0.0005, completion: 0.0005 } },
    
    // Meta Llama Models (Latest)
    { id: 'meta-llama/llama-3.2-405b-instruct', name: 'Llama 3.2 405B Instruct', context_length: 128000, pricing: { prompt: 0.005, completion: 0.005 } },
    { id: 'meta-llama/llama-3.2-90b-instruct', name: 'Llama 3.2 90B Instruct', context_length: 128000, pricing: { prompt: 0.002, completion: 0.002 } },
    { id: 'meta-llama/llama-3.2-70b-instruct', name: 'Llama 3.2 70B Instruct', context_length: 128000, pricing: { prompt: 0.00088, completion: 0.00088 } },
    { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 11B Vision', context_length: 128000, pricing: { prompt: 0.00055, completion: 0.00055 } },
    { id: 'meta-llama/llama-3.2-3b-instruct', name: 'Llama 3.2 3B Instruct', context_length: 128000, pricing: { prompt: 0.0006, completion: 0.0006 } },
    { id: 'meta-llama/llama-3.2-1b-instruct', name: 'Llama 3.2 1B Instruct', context_length: 128000, pricing: { prompt: 0.0004, completion: 0.0004 } },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B Instruct', context_length: 128000, pricing: { prompt: 0.005, completion: 0.005 } },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B Instruct', context_length: 128000, pricing: { prompt: 0.00088, completion: 0.00088 } },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct', context_length: 128000, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B Instruct', context_length: 8192, pricing: { prompt: 0.00081, completion: 0.00081 } },
    { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B Instruct', context_length: 8192, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'meta-llama/llama-2-70b-chat', name: 'Llama 2 70B Chat', context_length: 4096, pricing: { prompt: 0.0007, completion: 0.0009 } },
    { id: 'meta-llama/llama-2-13b-chat', name: 'Llama 2 13B Chat', context_length: 4096, pricing: { prompt: 0.00022, completion: 0.00022 } },
    { id: 'meta-llama/llama-2-7b-chat', name: 'Llama 2 7B Chat', context_length: 4096, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'meta-llama/codellama-70b-instruct', name: 'Code Llama 70B', context_length: 4096, pricing: { prompt: 0.0007, completion: 0.0007 } },
    { id: 'meta-llama/codellama-34b-instruct', name: 'Code Llama 34B', context_length: 4096, pricing: { prompt: 0.0007, completion: 0.0007 } },
    { id: 'meta-llama/codellama-13b-instruct', name: 'Code Llama 13B', context_length: 4096, pricing: { prompt: 0.00022, completion: 0.00022 } },
    { id: 'meta-llama/codellama-7b-instruct', name: 'Code Llama 7B', context_length: 4096, pricing: { prompt: 0.00018, completion: 0.00018 } },
    
    // Mistral Models (Latest)
    { id: 'mistralai/mistral-large-2411', name: 'Mistral Large (November 2024)', context_length: 128000, pricing: { prompt: 0.003, completion: 0.009 } },
    { id: 'mistralai/mistral-large', name: 'Mistral Large', context_length: 128000, pricing: { prompt: 0.008, completion: 0.024 } },
    { id: 'mistralai/mistral-medium', name: 'Mistral Medium', context_length: 32000, pricing: { prompt: 0.0027, completion: 0.0081 } },
    { id: 'mistralai/mistral-small', name: 'Mistral Small', context_length: 32000, pricing: { prompt: 0.002, completion: 0.006 } },
    { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo', context_length: 128000, pricing: { prompt: 0.0003, completion: 0.0003 } },
    { id: 'mistralai/codestral-latest', name: 'Codestral Latest', context_length: 32000, pricing: { prompt: 0.0003, completion: 0.0003 } },
    { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Instruct', context_length: 32768, pricing: { prompt: 0.00013, completion: 0.00013 } },
    { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B Instruct', context_length: 32000, pricing: { prompt: 0.00024, completion: 0.00024 } },
    { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B Instruct', context_length: 64000, pricing: { prompt: 0.00065, completion: 0.00065 } },
    
    // Cohere Models  
    { id: 'cohere/command-r-plus-08-2024', name: 'Command R+ (August 2024)', context_length: 128000, pricing: { prompt: 0.003, completion: 0.015 } },
    { id: 'cohere/command-r-plus', name: 'Command R+', context_length: 128000, pricing: { prompt: 0.003, completion: 0.015 } },
    { id: 'cohere/command-r', name: 'Command R', context_length: 128000, pricing: { prompt: 0.0005, completion: 0.0015 } },
    { id: 'cohere/command', name: 'Command', context_length: 4096, pricing: { prompt: 0.00005, completion: 0.00005 } },
    { id: 'cohere/command-nightly', name: 'Command Nightly', context_length: 4096, pricing: { prompt: 0.00005, completion: 0.00005 } },
    
    // xAI Grok Models
    { id: 'x-ai/grok-beta', name: 'Grok Beta', context_length: 131072, pricing: { prompt: 0.005, completion: 0.015 } },
    { id: 'x-ai/grok-vision-beta', name: 'Grok Vision Beta', context_length: 8192, pricing: { prompt: 0.005, completion: 0.015 } },
    
    // DeepSeek Models
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', context_length: 64000, pricing: { prompt: 0.00014, completion: 0.00028 } },
    { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', context_length: 16000, pricing: { prompt: 0.00014, completion: 0.00028 } },
    
    // Alibaba Qwen Models
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct', context_length: 131072, pricing: { prompt: 0.0009, completion: 0.0009 } },
    { id: 'qwen/qwen-2.5-32b-instruct', name: 'Qwen 2.5 32B Instruct', context_length: 131072, pricing: { prompt: 0.0007, completion: 0.0007 } },
    { id: 'qwen/qwen-2.5-14b-instruct', name: 'Qwen 2.5 14B Instruct', context_length: 131072, pricing: { prompt: 0.0003, completion: 0.0003 } },
    { id: 'qwen/qwen-2.5-7b-instruct', name: 'Qwen 2.5 7B Instruct', context_length: 131072, pricing: { prompt: 0.0002, completion: 0.0002 } },
    { id: 'qwen/qwen-2-72b-instruct', name: 'Qwen 2 72B Instruct', context_length: 32768, pricing: { prompt: 0.0009, completion: 0.0009 } },
    
    // Microsoft Models
    { id: 'microsoft/wizardlm-2-8x22b', name: 'WizardLM 2 8x22B', context_length: 65536, pricing: { prompt: 0.00063, completion: 0.00063 } },
    { id: 'microsoft/wizardlm-2-7b', name: 'WizardLM 2 7B', context_length: 32000, pricing: { prompt: 0.00007, completion: 0.00007 } },
    { id: 'microsoft/phi-3-medium-4k-instruct', name: 'Phi-3 Medium 4K', context_length: 4000, pricing: { prompt: 0.00014, completion: 0.00014 } },
    { id: 'microsoft/phi-3-mini-128k-instruct', name: 'Phi-3 Mini 128K', context_length: 128000, pricing: { prompt: 0.0001, completion: 0.0001 } },
    
    // Perplexity Models
    { id: 'perplexity/llama-3.1-sonar-large-128k-online', name: 'Perplexity Sonar Large Online', context_length: 127072, pricing: { prompt: 0.001, completion: 0.001 } },
    { id: 'perplexity/llama-3.1-sonar-small-128k-online', name: 'Perplexity Sonar Small Online', context_length: 127072, pricing: { prompt: 0.0002, completion: 0.0002 } },
    { id: 'perplexity/llama-3.1-sonar-huge-128k-online', name: 'Perplexity Sonar Huge Online', context_length: 127072, pricing: { prompt: 0.005, completion: 0.005 } },
    
    // Nous Research Models
    { id: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', name: 'Nous Hermes 2 Mixtral 8x7B DPO', context_length: 32000, pricing: { prompt: 0.00027, completion: 0.00027 } },
    { id: 'nousresearch/nous-hermes-llama2-13b', name: 'Nous Hermes Llama2 13B', context_length: 4096, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'nousresearch/nous-hermes-2-yi-34b', name: 'Nous Hermes 2 Yi 34B', context_length: 4096, pricing: { prompt: 0.00072, completion: 0.00072 } },
    { id: 'nousresearch/nous-capybara-34b', name: 'Nous Capybara 34B', context_length: 32768, pricing: { prompt: 0.0009, completion: 0.0009 } },
    { id: 'nousresearch/hermes-3-llama-3.1-405b', name: 'Hermes 3 Llama 3.1 405B', context_length: 128000, pricing: { prompt: 0.005, completion: 0.005 } },
    
    // Inflection AI
    { id: 'inflection/inflection-2.5', name: 'Inflection 2.5', context_length: 32000, pricing: { prompt: 0.0025, completion: 0.0025 } },
    
    // 01.AI Models
    { id: '01-ai/yi-large', name: 'Yi Large', context_length: 32768, pricing: { prompt: 0.003, completion: 0.003 } },
    { id: '01-ai/yi-large-turbo', name: 'Yi Large Turbo', context_length: 16384, pricing: { prompt: 0.0003, completion: 0.0003 } },
    { id: '01-ai/yi-vision', name: 'Yi Vision', context_length: 4096, pricing: { prompt: 0.0006, completion: 0.0006 } },
    
    // Anthropic Alternative
    { id: 'anthropic/claude-2.0', name: 'Claude 2.0', context_length: 100000, pricing: { prompt: 0.008, completion: 0.024 } },
    { id: 'anthropic/claude-instant-1.2', name: 'Claude Instant 1.2', context_length: 100000, pricing: { prompt: 0.0008, completion: 0.0024 } },
    
    // Free Models
    { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini 128K (Free)', context_length: 128000, pricing: { prompt: 0, completion: 0 } },
    { id: 'google/gemma-7b-it:free', name: 'Gemma 7B Instruct (Free)', context_length: 8192, pricing: { prompt: 0, completion: 0 } },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', context_length: 128000, pricing: { prompt: 0, completion: 0 } },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', context_length: 32768, pricing: { prompt: 0, completion: 0 } },
    { id: 'huggingfaceh4/zephyr-7b-beta:free', name: 'Zephyr 7B Beta (Free)', context_length: 32768, pricing: { prompt: 0, completion: 0 } },
    { id: 'openchat/openchat-7b:free', name: 'OpenChat 7B (Free)', context_length: 8192, pricing: { prompt: 0, completion: 0 } },
    { id: 'gryphe/mythomist-7b:free', name: 'MythoMist 7B (Free)', context_length: 32768, pricing: { prompt: 0, completion: 0 } },
    
    // Additional High-Quality Models
    { id: 'cognitive-computations/dolphin-mixtral-8x7b', name: 'Dolphin Mixtral 8x7B', context_length: 32000, pricing: { prompt: 0.0005, completion: 0.0005 } },
    { id: 'teknium/openhermes-2.5-mistral-7b', name: 'OpenHermes 2.5 Mistral 7B', context_length: 4096, pricing: { prompt: 0.00013, completion: 0.00013 } },
    { id: 'lizpreciatior/lzlv-70b-fp16-hf', name: 'LZLV 70B', context_length: 4096, pricing: { prompt: 0.00059, completion: 0.00078 } },
    { id: 'alpindale/goliath-120b', name: 'Goliath 120B', context_length: 6144, pricing: { prompt: 0.00938, completion: 0.00938 } },
    { id: 'undi95/toppy-m-7b', name: 'Toppy M 7B', context_length: 4096, pricing: { prompt: 0.00013, completion: 0.00013 } },
    { id: 'jondurbin/airoboros-l2-70b', name: 'Airoboros L2 70B', context_length: 4096, pricing: { prompt: 0.0007, completion: 0.0007 } },
    { id: 'phind/phind-codellama-34b', name: 'Phind CodeLlama 34B', context_length: 16384, pricing: { prompt: 0.0007, completion: 0.0007 } },
    
    // Latest Experimental & Research Models
    { id: 'deepseek/deepseek-r1-lite-preview', name: 'DeepSeek R1 Lite Preview', context_length: 64000, pricing: { prompt: 0.00014, completion: 0.00028 } },
    { id: 'anthropic/claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (October 2024)', context_length: 200000, pricing: { prompt: 0.003, completion: 0.015 } },
    { id: 'openai/gpt-4o-2024-11-20', name: 'GPT-4o (November 2024)', context_length: 128000, pricing: { prompt: 0.0025, completion: 0.01 } },
  ];

  // Handle settings change with database persistence and model updates
  const handleSettingsChange = async (newSettings: AISettings) => {
    // Update local state immediately for UI responsiveness
    setAiSettings(newSettings);
    // Save to database (will also update state on success)
    await saveSettings(newSettings);
  };

  // Initialize with welcome log
  useEffect(() => {
    const welcomeLog: LogEntry = {
      id: '1',
      timestamp: new Date(),
      message: 'MCP Integration Workbench initialized - Ready to connect to MCP servers',
      type: 'info',
      icon: '🚀'
    };
    setLogs([welcomeLog]);
  }, []);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error', icon: string, source?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      type,
      icon,
      source
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const discoverTools = async (serverUrl: string): Promise<MCPTool[]> => {
    addLog(`🔍 Discovering tools for: ${serverUrl}`, 'info', '🔍', 'Tool Discovery');
    
    // Enhanced tool discovery with proper headers for Pipedream MCP
    const discoveryMethods = [
      // Method 1: MCP protocol with proper Accept headers for Pipedream
      async () => {
        addLog(`🌐 Trying MCP protocol with proper headers...`, 'info', '🌐', 'Tool Discovery');
        const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {}
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const contentType = response.headers.get('content-type');
        addLog(`📥 Response content-type: ${contentType}`, 'info', '📥', 'Tool Discovery');
        
        if (contentType?.includes('text/event-stream')) {
          // Handle SSE response
          const text = await response.text();
          addLog(`📥 SSE Response: ${text.substring(0, 200)}...`, 'info', '📥', 'Tool Discovery');
          
          // Parse SSE format - look for data: lines
          const lines = text.split('\n');
          let jsonData = null;
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.substring(6).trim();
                if (dataStr && dataStr !== '[DONE]') {
                  jsonData = JSON.parse(dataStr);
                  break;
                }
              } catch (e) {
                continue;
              }
            }
          }
          
          if (jsonData) {
            addLog(`✅ Parsed SSE data successfully`, 'success', '✅', 'Tool Discovery');
            return jsonData;
          } else {
            throw new Error('No valid JSON data found in SSE response');
          }
        } else {
          // Handle regular JSON response
          const data = await response.json();
          addLog(`📥 JSON Response: ${JSON.stringify(data)}`, 'info', '📥', 'Tool Discovery');
          return data;
        }
      },
      
      // Method 2: Direct GET request with proper headers
      async () => {
        addLog(`🌐 Trying direct GET request...`, 'info', '🌐', 'Tool Discovery');
        const response = await fetch(serverUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/event-stream',
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/event-stream')) {
          const text = await response.text();
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.substring(6).trim();
                if (dataStr && dataStr !== '[DONE]') {
                  return JSON.parse(dataStr);
                }
              } catch (e) {
                continue;
              }
            }
          }
          throw new Error('No valid JSON data found in SSE response');
        } else {
          const data = await response.json();
          addLog(`📥 GET Response: ${JSON.stringify(data)}`, 'info', '📥', 'Tool Discovery');
          return data;
        }
      }
    ];

    // Try each method in sequence
    for (let i = 0; i < discoveryMethods.length; i++) {
      try {
        addLog(`🔄 Trying discovery method ${i + 1}/${discoveryMethods.length}...`, 'info', '🔄', 'Tool Discovery');
        const data = await discoveryMethods[i]();
        const discoveredTools = parseToolsResponse(data);
        
        if (discoveredTools.length > 0) {
          addLog(`✅ Successfully found ${discoveredTools.length} tools using method ${i + 1}`, 'success', '✅', 'Tool Discovery');
          return discoveredTools;
        } else {
          addLog(`⚠️ Method ${i + 1} returned no tools`, 'warning', '⚠️', 'Tool Discovery');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        addLog(`❌ Method ${i + 1} failed: ${errorMsg}`, 'error', '❌', 'Tool Discovery');
      }
    }
    
    // If all methods fail, throw error instead of falling back to demo tools
    addLog(`🚫 All discovery methods failed for ${serverUrl}`, 'error', '🚫', 'Tool Discovery');
    addLog(`💡 Please verify your Pipedream MCP server URL is correct and accessible`, 'warning', '💡', 'Tool Discovery');
    throw new Error('Could not discover tools from the provided server URL. Please check the server URL and try again.');
  };

  const parseToolsResponse = (data: any): MCPTool[] => {
    addLog(`🔍 Raw server response: ${JSON.stringify(data, null, 2)}`, 'info', '🔍', 'Tool Discovery');
    addLog(`🔍 Data type: ${typeof data}, isArray: ${Array.isArray(data)}`, 'info', '🔍', 'Tool Discovery');
    
    let discoveredTools: MCPTool[] = [];
    
    // Check multiple possible response formats
    if (data.tools && Array.isArray(data.tools)) {
      discoveredTools = data.tools;
      addLog(`✅ Found ${discoveredTools.length} tools in data.tools format`, 'success', '✅', 'Tool Discovery');
    } else if (Array.isArray(data)) {
      discoveredTools = data;
      addLog(`✅ Found ${discoveredTools.length} tools in array format`, 'success', '✅', 'Tool Discovery');
    } else if (data.result && Array.isArray(data.result.tools)) {
      discoveredTools = data.result.tools;
      addLog(`✅ Found ${discoveredTools.length} tools in data.result.tools format`, 'success', '✅', 'Tool Discovery');
    } else if (data.result && data.result.tools) {
      // Handle case where tools might be an object instead of array
      discoveredTools = Object.values(data.result.tools);
      addLog(`✅ Found ${discoveredTools.length} tools in data.result.tools object format`, 'success', '✅', 'Tool Discovery');
    } else {
      // Try to extract tools from various possible formats
      addLog(`🔄 Searching through response for tool arrays...`, 'info', '🔄', 'Tool Discovery');
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0 && value[0]?.name) {
          discoveredTools = [...discoveredTools, ...value];
          addLog(`✅ Found tools in data.${key} format`, 'success', '✅', 'Tool Discovery');
        }
      }
    }
    
    addLog(`📊 Raw discovered tools count: ${discoveredTools.length}`, 'info', '📊', 'Tool Discovery');
    
    // Ensure tools have required properties
    const processedTools = discoveredTools.map(tool => ({
      name: tool.name || 'unnamed_tool',
      description: tool.description || 'No description available',
      category: tool.category || 'utility',
      parameters: tool.parameters || tool.inputSchema,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema
    }));
    
    addLog(`🎯 Final processed tools: ${processedTools.map(t => t.name).join(', ')}`, 'success', '🎯', 'Tool Discovery');
    
    return processedTools;
  };

  const handleAddServer = async (name: string, url: string, description?: string) => {
    setIsAddingServer(true);
    addLog(`📝 Adding MCP server: ${name} (${url})`, 'info', '📝', 'Server Management');
    
    try {
      const discoveredTools = await discoverTools(url);
      
      const newServer: MCPServer = {
        id: Date.now().toString(),
        name,
        url,
        status: 'connected',
        tools: discoveredTools,
        lastConnected: new Date(),
        description
      };
      
      // Save to database and update local state
      await saveServer(newServer);
      setTools(prev => [...prev, ...discoveredTools.map(tool => ({ 
        ...tool, 
        serverUrl: url, 
        serverId: newServer.id 
      }))]);
      
      addLog(`✅ Server added successfully: ${name} with ${discoveredTools.length} tools`, 'success', '✅', 'Server Management');
      toast({
        title: "Server Connected",
        description: `Successfully connected to ${name} with ${discoveredTools.length} tools`,
      });
      
      // Auto-switch to tools tab if this is the first server with tools
      if (tools.length === 0 && discoveredTools.length > 0) {
        setActiveTab('tools');
      }
      
    } catch (error) {
      addLog(`❌ Failed to add server: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', '❌', 'Server Management');
      toast({
        title: "Connection Failed", 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsAddingServer(false);
    }
  };

  const handleRefreshServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    setRefreshingServer(serverId);
    addLog(`🔄 Refreshing server: ${server.name}`, 'info', '🔄', 'Server Management');
    
    try {
      const discoveredTools = await discoverTools(server.url);
      
      const updatedServer = { ...server, tools: discoveredTools, lastConnected: new Date(), status: 'connected' as const };
      
      // Save to database and update local state
      await saveServer(updatedServer);
      
      // Update tools list
      setTools(prev => {
        const otherTools = prev.filter(tool => tool.serverId !== serverId);
        const newTools = discoveredTools.map(tool => ({ 
          ...tool, 
          serverUrl: server.url, 
          serverId: server.id 
        }));
        return [...otherTools, ...newTools];
      });
      
      addLog(`✅ Server refreshed: ${server.name} (${discoveredTools.length} tools)`, 'success', '✅', 'Server Management');
      toast({
        title: "Server Refreshed",
        description: `Refreshed ${server.name} with ${discoveredTools.length} tools`,
      });
      
    } catch (error) {
      const errorServer = { ...server, status: 'error' as const };
      await saveServer(errorServer);
      addLog(`❌ Server refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', '❌', 'Server Management');
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setRefreshingServer(undefined);
    }
  };

  const handleRemoveServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    // Remove from database
    await removeServer(serverId);
    setTools(prev => prev.filter(tool => tool.serverId !== serverId));
    
    addLog(`🗑️ Server removed: ${server.name}`, 'info', '🗑️', 'Server Management');
    toast({
      title: "Server Removed",
      description: `Removed ${server.name} from connected servers`,
    });
  };

  const handleClearLog = () => {
    setLogs([]);
    addLog('🧹 Activity log cleared', 'info', '🧹', 'System');
  };

  const handleExportLog = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toLocaleString()}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-log-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('📥 Activity log exported', 'info', '📥', 'System');
  };

  const getTabBadges = () => {
    return {
      servers: servers.length,
      tools: tools.length,
      chat: (aiSettings.openaiApiKey || aiSettings.openrouterApiKey) ? 'Ready' : 'Setup',
      logs: logs.length
    };
  };

  const badges = getTabBadges();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/9b4be813-c110-45e0-aed0-0ca7c4454219.png" 
                alt="Synapsecore Logo" 
                className="h-16 w-16 mr-4"
              />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Synapsecore Super Agent
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-powered MCP tool orchestration platform
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:h-12">
            <TabsTrigger value="servers" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Servers
              <Badge variant="secondary" className="ml-1 text-xs">
                {badges.servers}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tools
              <Badge variant="secondary" className="ml-1 text-xs">
                {badges.tools}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              AI Config
              <Badge 
                variant={(aiSettings.openaiApiKey || aiSettings.openrouterApiKey) ? "default" : "secondary"} 
                className="ml-1 text-xs"
              >
                {(aiSettings.openaiApiKey || aiSettings.openrouterApiKey) ? "✓" : "Setup"}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
              <Badge 
                variant={aiSettings.openaiApiKey && servers.length > 0 ? "default" : "secondary"} 
                className="ml-1 text-xs"
              >
                {badges.chat}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
              <Badge variant="secondary" className="ml-1 text-xs">
                {badges.logs}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servers" className="space-y-6">
            <MCPServerForm 
              onAddServer={handleAddServer} 
              isLoading={isAddingServer}
            />
            <ConnectedServers 
              servers={servers}
              onRefreshServer={handleRefreshServer}
              onRemoveServer={handleRemoveServer}
              isRefreshing={refreshingServer}
            />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <AvailableTools 
              tools={tools}
              onToolSelect={(tool) => {
                addLog(`🔧 Tool selected: ${tool.name}`, 'info', '🔧', 'Tool Interaction');
                toast({
                  title: "Tool Selected",
                  description: `Selected ${tool.name} for testing`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AISettingsCard 
              settings={aiSettings}
              onSettingsChange={handleSettingsChange}
              onLog={addLog}
            />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <AIChat 
              servers={servers}
              tools={tools}
              settings={aiSettings}
              onSettingsChange={handleSettingsChange}
              availableModels={availableModels}
              openrouterModels={openrouterModels}
              onLog={addLog}
            />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <ActivityLog 
              logs={logs}
              onClearLog={handleClearLog}
              onExportLog={handleExportLog}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};