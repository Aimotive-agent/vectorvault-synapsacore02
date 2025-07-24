import { useState, useRef, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Send, Copy, Check } from 'lucide-react';
import { BotIcon, Loader2Icon, BrainIcon } from './CustomMCPIcons';
import { useToast } from '@/components/ui/use-toast';
import { ChatMessage, MCPTool, MCPServer, AISettings, ToolCall, OpenAIModel, OpenRouterModel } from '@/types/mcp';
import { useChatSessions } from '@/hooks/useChatSessions';
import { FileUpload } from './FileUpload';
import { formatDistanceToNow } from 'date-fns';
import VectorBaseSelector from '../vectorvault/VectorBaseSelector';
import SaveToVaultButton from '../vectorvault/SaveToVaultButton';
import { AppContext } from '../vectorvault/contexts/AppContext';
import vectorRetrievalService from '@/services/vectorRetrievalService';
import geminiService from '../vectorvault/services/geminiService';
import { useMCPServers } from '@/hooks/useMCPServers';

interface AIChatProps {
  servers: MCPServer[];
  tools: MCPTool[];
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  availableModels: OpenAIModel[];
  openrouterModels: OpenRouterModel[];
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error', icon?: string) => void;
  isVectorVault?: boolean;
}

export const AIChat = ({ servers, tools, settings, onSettingsChange, availableModels, openrouterModels, onLog, isVectorVault = false }: AIChatProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { sessions, currentSessionId: activeSessionId, createSession, loadMessages: switchSession, messages, setMessages, saveMessage } = useChatSessions();
  const { selectedKbId, setSelectedKbId } = useContext(AppContext);
  const { toast } = useToast();
  const { executeTool } = useMCPServers();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentApiKey = settings.provider === 'openai' ? settings.openaiApiKey : settings.openrouterApiKey;

  const activeMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];

  // Dynamic AI response generation based on user-selected provider
  const generateAIResponse = async (prompt: string, settings: AISettings): Promise<string> => {
    const { provider, selectedModel, temperature, maxTokens } = settings;
    
    switch (provider) {
      case 'openai':
        return await generateOpenAIResponse(prompt, settings);
      case 'openrouter':
        return await generateOpenRouterResponse(prompt, settings);
      case 'gemini':
        return await geminiService.generateResponse(prompt);
      case 'anthropic':
        return await generateAnthropicResponse(prompt, settings);
      case 'deepseek':
        return await generateDeepSeekResponse(prompt, settings);
      case 'perplexity':
        return await generatePerplexityResponse(prompt, settings);
      case 'grok':
        return await generateGrokResponse(prompt, settings);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  };

  // OpenAI API call
  const generateOpenAIResponse = async (prompt: string, settings: AISettings): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  };

  // OpenRouter API call
  const generateOpenRouterResponse = async (prompt: string, settings: AISettings): Promise<string> => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openrouterApiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SynapseCore AI Chat'
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  };

  // Anthropic API call
  const generateAnthropicResponse = async (prompt: string, settings: AISettings): Promise<string> => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.content[0]?.text || 'No response received';
  };

  // DeepSeek API call
  const generateDeepSeekResponse = async (prompt: string, settings: AISettings): Promise<string> => {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  };

  // Perplexity API call
  const generatePerplexityResponse = async (prompt: string, settings: AISettings): Promise<string> => {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.perplexityApiKey}`
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  };

  // Grok API call
  const generateGrokResponse = async (prompt: string, settings: AISettings): Promise<string> => {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.grokApiKey}`
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [activeMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (activeSessionId) saveMessage(userMessage, activeSessionId);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Check if user wants to execute a tool directly
      if (tools && tools.length > 0) {
        const lowerInput = userMessage.content.toLowerCase();
        
        // Simple tool detection for Google Drive operations
        if (lowerInput.includes('find') && (lowerInput.includes('folder') || lowerInput.includes('file'))) {
          let toolName = '';
          if (lowerInput.includes('folder')) {
            toolName = tools.find(t => t.name.includes('FIND-FOLDER'))?.name || '';
          } else {
            toolName = tools.find(t => t.name.includes('FIND-FILE'))?.name || '';
          }
          
          if (toolName) {
            try {
              onLog(` Executing ${toolName}...`, 'info', ' ');
              const { executeTool } = useMCPServers();
              const result = await executeTool(toolName, { instruction: userMessage.content });
              
              const botMessage: ChatMessage = {
                id: `asst_${Date.now()}`,
                role: 'assistant',
                content: `I executed ${toolName} for you:\n\n${JSON.stringify(result, null, 2)}`,
                timestamp: new Date().toISOString(),
                toolCalls: [],
              };
              setMessages(prev => [...prev, botMessage]);
              if (activeSessionId) saveMessage(botMessage, activeSessionId);
              return;
            } catch (error: any) {
              onLog(` Tool execution failed: ${error.message}`, 'error', ' ');
            }
          }
        }
      }
      
      let augmentedPrompt = userMessage.content;
      
      // Add MCP tools context to the prompt
      if (tools && tools.length > 0) {
        const toolsContext = `\n\n=== AVAILABLE MCP TOOLS ===\n${tools.map(tool => {
          const schemaStr = tool.inputSchema ? JSON.stringify(tool.inputSchema, null, 2) : 'No schema available';
          return `\n**${tool.name}**\n- Description: ${tool.description}\n- Category: ${tool.category}\n- Input Schema: ${schemaStr}`;
        }).join('\n')}\n\n=== TOOL USAGE INSTRUCTIONS ===\nYou have full access to these ${tools.length} MCP tools. When a user's request can be fulfilled using any of these tools, you should:\n1. Explain which tool(s) would be helpful\n2. Describe what the tool will do\n3. Ask for any required parameters if not provided\n4. Let the user know they can execute the tool through this chat interface\n\nThese tools can help with file operations, data processing, API calls, and various other tasks. Feel free to suggest their use when appropriate.`;
        
        augmentedPrompt = userMessage.content + toolsContext;
        onLog(`Added ${tools.length} MCP tools with full schemas to context.`, 'info', ' ');
        onLog(`Added ${tools.length} MCP tools with full schemas to context.`, 'info', '🔧');
      }
      
      if (selectedKbId) {
        onLog('Retrieving context from Vector Vault...', 'info', '🧠');
        augmentedPrompt = await vectorRetrievalService.generateRAGPrompt(
          settings.systemPrompt || 'You are a helpful AI assistant.',
          selectedKbId,
          augmentedPrompt
        );
        onLog('Generated RAG-enhanced prompt.', 'success', '🧠');
      }

      // Show thinking message
      const thinkingMessage: ChatMessage = {
        id: `thinking-${Date.now()}`,
        role: 'assistant',
        content: 'Thinking...',
        timestamp: new Date().toISOString(),
        toolCalls: [],
      };
      setMessages(prev => [...prev, thinkingMessage]);

      // Get AI response using user-selected provider and model
      const responseText = await generateAIResponse(augmentedPrompt, settings);
      
      // Replace thinking message with actual response
      const botMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        toolCalls: [],
      };
      setMessages(prev => prev.map(msg => (msg.id === thinkingMessage.id ? botMessage : msg)));
      if (activeSessionId) saveMessage(botMessage, activeSessionId);

    } catch (error: any) {
      const errorMessage = `Error: ${error.message || 'An unexpected error occurred.'}`;
      const errorBotMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorBotMessage]);
    if (activeSessionId) saveMessage(errorBotMessage, activeSessionId);
      onLog(errorMessage, 'error', '🔥');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canSendMessage = () => {
    return inputMessage.trim().length > 0 && !isProcessing;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied to clipboard!', className: 'bg-green-500 text-white' });
    }, () => {
      toast({ title: 'Failed to copy.', variant: 'destructive' });
    });
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white">AI Chat</h2>
        <p className="text-sm text-gray-400">Powered by SynapseCore & VectorVault</p>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center flex-shrink-0">
                  <BotIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`max-w-xl p-4 rounded-2xl ${message.role === 'user' ? 'bg-brand-blue text-white rounded-br-none' : 'bg-background-light text-gray-300 rounded-bl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </span>
                  {message.role === 'assistant' && !message.isError && (
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => copyToClipboard(message.content)}>
                      <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                    </Button>
                  )}
                </div>
              </div>
              {message.role === 'user' && (
                 <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {isProcessing && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start gap-4">
               <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center flex-shrink-0">
                  <BotIcon className="w-5 h-5 text-white" />
                </div>
              <div className="max-w-xl p-4 rounded-2xl bg-background-light text-gray-300 rounded-bl-none">
                <Loader2Icon className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-background-dark">
        <div className="relative">
          <Input
            placeholder="Message SynapseCore..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing}
            className="bg-background-light border-transparent rounded-full pl-4 pr-20 h-12 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-brand-purple"
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-2">
            <VectorBaseSelector
              selectedKbId={selectedKbId}
              onSelectKb={setSelectedKbId}
              className="flex-shrink-0"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!canSendMessage()}
              size="icon"
              className="w-9 h-9 rounded-full bg-brand-purple hover:bg-brand-purple/90 text-white"
              type="button"
            >
              {isProcessing ? (
                <Loader2Icon className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};