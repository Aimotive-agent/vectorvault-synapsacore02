import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, User, Send, Loader2, Wrench, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { ChatMessage, MCPTool, MCPServer, AISettings, ToolCall } from '@/types/mcp';
import { formatDistanceToNow } from 'date-fns';

interface AIChatProps {
  servers: MCPServer[];
  tools: MCPTool[];
  settings: AISettings;
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error', icon: string) => void;
}

export const AIChat = ({ servers, tools, settings, onLog }: AIChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your AI assistant with access to ${tools.length} tools from ${servers.length} connected MCP servers. I can help you automate tasks, manage data, and interact with various services. What would you like me to help you with?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [tools.length, servers.length]);

  const callOpenAI = async (messages: ChatMessage[]): Promise<string> => {
    if (!settings.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemMessage = {
      role: 'system',
      content: settings.systemPrompt || `You are a helpful AI assistant with access to ${tools.length} MCP tools. You can use these tools to help users accomplish various tasks. When you need to use a tool, explain what you're doing and why.`
    };

    const formattedMessages = [
      systemMessage,
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.selectedModel || 'gpt-3.5-turbo',
        messages: formattedMessages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        tools: tools.map(tool => ({
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
        }))
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
  };

  const executeTool = async (toolName: string, parameters: Record<string, any>): Promise<any> => {
    const tool = tools.find(t => t.name === toolName);
    if (!tool || !tool.serverUrl) {
      throw new Error(`Tool ${toolName} not found or not properly configured`);
    }

    onLog(`🔧 Executing tool: ${toolName}`, 'info', '🔧');

    const response = await fetch(tool.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Tool execution failed');
    }

    onLog(`✅ Tool ${toolName} executed successfully`, 'success', '✅');
    return data.result;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      onLog('💬 Processing message with AI...', 'info', '💬');
      
      const allMessages = [...messages, userMessage];
      const aiResponse = await callOpenAI(allMessages);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      onLog('✅ AI response generated', 'success', '✅');

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your AI settings and try again.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
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

  const canSendMessage = () => {
    return inputMessage.trim() && 
           !isProcessing && 
           settings.openaiApiKey && 
           settings.selectedModel &&
           servers.some(s => s.status === 'connected');
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
        <CardDescription>
          Chat with your AI agent that has access to all connected MCP tools and services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                      
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
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
              variant="mcp"
              size="sm"
              className="px-4"
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
            {!settings.openaiApiKey && (
              <Badge variant="outline" className="text-warning border-warning/50">
                ⚠️ OpenAI API key required
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