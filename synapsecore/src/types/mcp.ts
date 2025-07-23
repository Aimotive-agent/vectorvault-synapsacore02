export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  tools: MCPTool[];
  lastConnected?: Date;
  description?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  serverUrl?: string;
  serverId?: string;
  category?: string;
  inputSchema?: any;
  outputSchema?: any;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon: string;
  source?: string;
}

export interface ToolTestResult {
  success: boolean;
  result?: any;
  error?: string;
  duration?: number;
}

export interface OpenAIModel {
  id: string;
  name: string;
  context_window: number;
  pricing?: {
    input: number;
    output: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  file_attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}

export interface AISettings {
  openaiApiKey: string;
  openrouterApiKey: string;
  geminiApiKey: string;
  anthropicApiKey: string;
  deepseekApiKey: string;
  perplexityApiKey: string;
  grokApiKey: string;
  provider: 'openai' | 'openrouter' | 'gemini' | 'anthropic' | 'deepseek' | 'perplexity' | 'grok';
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

export interface PresetMCPServer {
  name: string;
  url: string;
  description: string;
  category: string;
  features: string[];
  documentation?: string;
}