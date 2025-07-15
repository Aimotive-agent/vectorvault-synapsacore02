import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, User, Send, Loader2, Wrench, AlertCircle, Clock, CheckCircle, Copy, Check, Brain, Settings, Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, MCPTool, MCPServer, AISettings, ToolCall, OpenAIModel, OpenRouterModel } from '@/types/mcp';
import { useChatSessions } from '@/hooks/useChatSessions';
import { FileUpload } from './FileUpload';
import { formatDistanceToNow } from 'date-fns';

interface AIChatProps {
  servers: MCPServer[];
  tools: MCPTool[];
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  availableModels: OpenAIModel[];
  openrouterModels: OpenRouterModel[];
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error', icon: string) => void;
}

export const AIChat = ({ servers, tools, settings, onSettingsChange, availableModels, openrouterModels, onLog }: AIChatProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Use chat sessions hook
  const {
    sessions,
    currentSessionId,
    messages,
    createSession,
    loadMessages,
    saveMessage,
    deleteSession,
    setMessages
  } = useChatSessions();

  // Get current API key based on provider
  const currentApiKey = settings.provider === 'openrouter' 
    ? settings.openrouterApiKey 
    : settings.openaiApiKey;
  
  // Use the same comprehensive model lists as passed from MCPWorkbench
  const getCurrentModels = () => {
    return settings.provider === 'openrouter' ? openrouterModels : availableModels;
  };
  
  const selectedModel = getCurrentModels().find(m => m.id === settings.selectedModel);
  const modelDisplayName = selectedModel?.name || settings.selectedModel;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Initialize with welcome message or create new session
  useEffect(() => {
    if (messages.length === 0 && !currentSessionId) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your AI assistant with access to ${tools.length} tools from ${servers.length} connected MCP servers. I can help you automate tasks, manage data, and interact with various services. What would you like me to help you with?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [tools.length, servers.length, messages.length, currentSessionId]);

  const callOpenAI = async (messages: ChatMessage[]): Promise<{ content: string; toolCalls?: ToolCall[] }> => {
    const apiKey = settings.provider === 'openrouter' 
      ? settings.openrouterApiKey 
      : settings.openaiApiKey;
      
    if (!apiKey) {
      throw new Error(`${settings.provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API key not configured`);
    }

    const systemMessage = {
      role: 'system',
      content: settings.systemPrompt || `You are a helpful AI assistant with access to ${tools.length} MCP tools and advanced vision capabilities. Available tools: ${tools.map(t => `${t.name} - ${t.description}`).join(', ')}. When a user asks for something that can be accomplished with these tools, use them to help complete the task. You can also analyze uploaded files, images, and documents in detail. For images, provide thorough visual analysis including objects, text, colors, composition, and any relevant insights.`
    };

    const formattedMessages = await Promise.all([
      systemMessage,
      ...await Promise.all(messages.map(async (msg) => {
        const messageContent: any = {
          role: msg.role,
          content: msg.content
        };

        // Add file attachments if present (for vision models)
        if (msg.file_attachments && msg.file_attachments.length > 0) {
          const imageAttachments = await Promise.all(
            msg.file_attachments
              .filter(file => file.type?.startsWith('image/'))
              .map(async (file) => {
                try {
                  // Convert image URL to base64 for OpenAI vision API
                  const response = await fetch(file.url);
                  const blob = await response.blob();
                  const arrayBuffer = await blob.arrayBuffer();
                  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                  const mimeType = file.type || 'image/png';
                  
                  return {
                    type: 'image_url',
                    image_url: { 
                      url: `data:${mimeType};base64,${base64}`,
                      detail: 'high' // Use high detail for better analysis
                    }
                  };
                } catch (error) {
                  console.error('Error converting image to base64:', error);
                  return null;
                }
              })
          );

          const validImageAttachments = imageAttachments.filter(att => att !== null);
          
          if (validImageAttachments.length > 0) {
            messageContent.content = [
              { type: 'text', text: msg.content },
              ...validImageAttachments
            ];
          }
        }

        return messageContent;
      }))
    ]);

    const requestBody = {
      model: settings.selectedModel || 'gpt-3.5-turbo',
      messages: formattedMessages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    };

    // Only add tools if we have them available
    if (tools.length > 0) {
      console.log(`🔧 AIChat: Setting up ${tools.length} tools for OpenAI:`, tools.map(t => ({ name: t.name, description: t.description, serverId: t.serverId })));
      (requestBody as any).tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema || {
            type: 'object',
            properties: {
              instruction: {
                type: 'string',
                description: 'The instruction or parameters for this tool'
              }
            }
          }
        }
      }));
      (requestBody as any).tool_choice = 'auto';
      console.log(`🤖 OpenAI request body tools:`, (requestBody as any).tools);
    } else {
      console.log(`⚠️ AIChat: No tools available for OpenAI`);
    }

    const apiUrl = settings.provider === 'openrouter' 
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(settings.provider === 'openrouter' && {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Synapsecore Super Agent'
        })
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices[0]?.message;
    
    if (!message) {
      throw new Error('No response generated');
    }

    // Check if AI wants to call tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCalls: ToolCall[] = [];
      
      for (const toolCall of message.tool_calls) {
        try {
          let parameters = JSON.parse(toolCall.function.arguments || '{}');
          
          // Fix parameter mapping for Gmail send_email action
          if (toolCall.function.name === 'send_email') {
            // Map 'message' to 'body' for Pipedream Gmail action
            if (parameters.message && !parameters.body) {
              parameters.body = parameters.message;
              delete parameters.message;
            }
            // Set default body type to HTML if not specified
            if (!parameters.bodyType) {
              parameters.bodyType = 'html';
            }
          }
          
          const result = await executeTool(toolCall.function.name, parameters);
          
          toolCalls.push({
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments || '{}'),
            result: result
          });
        } catch (error) {
          toolCalls.push({
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments || '{}'),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Get follow-up response from AI with tool results
      const toolResultMessages = [
        ...formattedMessages,
        {
          role: 'assistant',
          content: message.content || '',
          tool_calls: message.tool_calls
        },
        ...message.tool_calls.map((toolCall: any, index: number) => ({
          role: 'tool',
          content: JSON.stringify(toolCalls[index].result || toolCalls[index].error),
          tool_call_id: toolCall.id
        }))
      ];

      const followUpResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(settings.provider === 'openrouter' && {
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Synapsecore Super Agent'
          })
        },
        body: JSON.stringify({
          model: settings.selectedModel || 'gpt-3.5-turbo',
          messages: toolResultMessages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        return {
          content: followUpData.choices[0]?.message?.content || 'Tool execution completed.',
          toolCalls: toolCalls
        };
      }
    }

    return {
      content: message.content || 'No response generated',
      toolCalls: undefined
    };
  };

  const executeTool = async (toolName: string, parameters: Record<string, any>): Promise<any> => {
    const tool = tools.find(t => t.name === toolName);
    if (!tool || !tool.serverUrl) {
      throw new Error(`Tool ${toolName} not found or not properly configured`);
    }

    onLog(`🔧 Executing tool: ${toolName}`, 'info', '🔧');

    try {
      const response = await fetch(tool.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: parameters
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        onLog(`❌ HTTP ${response.status}: ${errorText}`, 'error', '❌');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('text/event-stream')) {
        // Handle SSE response
        const text = await response.text();
        onLog(`📥 SSE Response received`, 'info', '📥');
        
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
          data = jsonData;
          onLog(`✅ Parsed SSE data successfully`, 'success', '✅');
        } else {
          throw new Error('No valid JSON data found in SSE response');
        }
      } else {
        // Handle regular JSON response
        data = await response.json();
        onLog(`📥 JSON Response received`, 'info', '📥');
      }
      
      if (data.error) {
        onLog(`❌ Tool error: ${data.error.message}`, 'error', '❌');
        throw new Error(data.error.message || 'Tool execution failed');
      }

      onLog(`✅ Tool executed successfully`, 'success', '✅');
      return data.result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        onLog(`❌ Network error: Failed to reach MCP server. Check if the server URL is correct and accessible.`, 'error', '❌');
        throw new Error('Network error: Cannot reach MCP server. Please check the server URL and ensure it supports CORS.');
      }
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    // Create session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = await createSession();
      sessionId = newSession?.id;
      if (!sessionId) return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    // Save user message to database
    await saveMessage(userMessage, sessionId, settings.selectedModel, settings.provider);

    try {
      onLog('💬 Processing message with AI...', 'info', '💬');
      
      const allMessages = [...messages, userMessage];
      const aiResponse = await callOpenAI(allMessages);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        toolCalls: aiResponse.toolCalls,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to database
      await saveMessage(aiMessage, sessionId, settings.selectedModel, settings.provider);
      
      if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
        onLog(`✅ AI response generated with ${aiResponse.toolCalls.length} tool calls`, 'success', '✅');
      } else {
        onLog('✅ AI response generated', 'success', '✅');
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your AI settings and try again.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage, sessionId, settings.selectedModel, settings.provider);
      onLog(`❌ AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', '❌');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (role: ChatMessage['role']) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'assistant':
        return <Bot className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(messageId);
      toast({
        title: "Copied to clipboard",
        description: "Message content copied successfully",
      });
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const canSendMessage = () => {
    const hasApiKey = settings.provider === 'openrouter' 
      ? settings.openrouterApiKey 
      : settings.openaiApiKey;
    
    // Basic requirements for sending a message
    return inputMessage.trim().length > 0 && 
           !isProcessing && 
           hasApiKey && 
           settings.selectedModel;
    // Removed the server requirement to allow basic AI chat without MCP tools
  };

  const handleFileAnalyzed = async (analysis: string, fileName: string, fileUrl?: string, fileType?: string) => {
    // Create session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = await createSession();
      sessionId = newSession?.id;
      if (!sessionId) return;
    }

    // Create a file upload message that appears in chat
    const fileMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `📁 **File uploaded: ${fileName}**\n\n${analysis}`,
      timestamp: new Date(),
      file_attachments: fileUrl ? [{
        name: fileName,
        url: fileUrl,
        type: fileType || 'unknown',
        size: 0
      }] : undefined
    };

    setMessages(prev => [...prev, fileMessage]);
    
    // Save file message to database
    await saveMessage(fileMessage, sessionId, settings.selectedModel, settings.provider);
    
    setShowFileUpload(false);
    
    // Auto-analyze the file with AI
    if (fileUrl && fileType?.startsWith('image/')) {
      setTimeout(() => {
        setInputMessage(`Please analyze this uploaded image: ${fileName}`);
      }, 500);
    }
  };

  const handleNewChat = async () => {
    await createSession();
  };

  const handleLoadSession = async (sessionId: string) => {
    await loadMessages(sessionId);
  };

  return (
    <Card className="bg-gradient-surface border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Agent Chat
          <div className="ml-auto flex gap-2">
            <Badge variant="outline" className="text-xs">
              {tools.length} tools
            </Badge>
            <Badge variant="outline" className="text-xs">
              {servers.filter(s => s.status === 'connected').length} connected
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Chat with your AI agent that has access to all connected MCP tools and services</span>
          <div className="flex items-center gap-3 text-xs">
            {/* Provider Selection */}
            <div className="flex items-center gap-2">
              <Settings className="h-3 w-3" />
              <Select
                value={settings.provider}
                onValueChange={(value) => onSettingsChange({ ...settings, provider: value as 'openai' | 'openrouter' })}
              >
                <SelectTrigger className="h-7 text-xs min-w-[100px] border-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Model Selection */}
            <div className="flex items-center gap-2">
              <Brain className="h-3 w-3" />
              <Select
                value={settings.selectedModel}
                onValueChange={(value) => onSettingsChange({ ...settings, selectedModel: value })}
              >
                <SelectTrigger className="h-7 text-xs min-w-[180px] border-muted">
                  <SelectValue>
                    <span className="truncate">{modelDisplayName}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {getCurrentModels().map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span className="text-sm">{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Context: {((model as any).context_window || (model as any).context_length)?.toLocaleString()} tokens
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Session Management */}
        <div className="flex gap-2 pb-2 border-b">
          <Button
            onClick={handleNewChat}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            New Chat
          </Button>
          
          {sessions.length > 0 && (
            <Select value={currentSessionId || ''} onValueChange={handleLoadSession}>
              <SelectTrigger className="h-8 min-w-[200px] text-xs">
                <SelectValue placeholder="Select a chat session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{session.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button
            onClick={() => setShowFileUpload(!showFileUpload)}
            size="sm"
            variant="outline"
            className="flex items-center gap-1 ml-auto"
          >
            <Upload className="h-3 w-3" />
            Upload File
          </Button>
        </div>

        {/* File Upload Section */}
        {showFileUpload && (
          <FileUpload
            onFileAnalyzed={handleFileAnalyzed}
            className="mb-4"
          />
        )}
        
        {/* Chat Messages */}
        <div className="h-96 border rounded-lg bg-muted/30">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`p-2 rounded-full ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-accent text-accent-foreground'
                      }`}>
                        {getMessageIcon(message.role)}
                      </div>
                      
                       <div className={`p-3 rounded-lg relative group ${
                         message.role === 'user'
                           ? 'bg-primary text-primary-foreground'
                           : 'bg-card border'
                       }`}>
                         <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                         
                         {/* Copy button for assistant messages */}
                         {message.role === 'assistant' && (
                           <Button
                             variant="ghost"
                             size="sm"
                             className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                             onClick={() => copyToClipboard(message.content, message.id)}
                           >
                             {copiedMessage === message.id ? (
                               <Check className="h-3 w-3" />
                             ) : (
                               <Copy className="h-3 w-3" />
                             )}
                           </Button>
                         )}
                        
                        {/* Tool Calls */}
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <Separator />
                            <p className="text-xs font-medium opacity-75">Tool Calls:</p>
                            {message.toolCalls.map((toolCall) => (
                              <div key={toolCall.id} className="p-2 bg-muted/50 rounded text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <Wrench className="h-3 w-3" />
                                  <span className="font-medium">{toolCall.name}</span>
                                  {toolCall.error ? (
                                    <AlertCircle className="h-3 w-3 text-destructive" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 text-success" />
                                  )}
                                </div>
                                {toolCall.result && (
                                  <p className="opacity-75">{JSON.stringify(toolCall.result, null, 2)}</p>
                                )}
                                {toolCall.error && (
                                  <p className="text-destructive opacity-75">{toolCall.error}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 mt-2 text-xs opacity-50">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 rounded-full bg-accent text-accent-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="p-3 rounded-lg bg-card border">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me to help you with any task using the available tools..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!canSendMessage()}
              size="sm"
              className="px-4"
              type="button"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Status Messages */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {!currentApiKey && (
              <Badge variant="outline" className="text-warning border-warning/50">
                ⚠️ {settings.provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API key required
              </Badge>
            )}
            {servers.filter(s => s.status === 'connected').length === 0 && (
              <Badge variant="outline" className="text-warning border-warning/50">
                ⚠️ No connected servers
              </Badge>
            )}
            {tools.length === 0 && (
              <Badge variant="outline" className="text-warning border-warning/50">
                ⚠️ No tools available
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};