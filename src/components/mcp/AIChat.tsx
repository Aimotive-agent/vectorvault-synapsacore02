import { useState, useRef, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Send, AlertCircle, Copy, Check, Settings, Plus, Upload } from 'lucide-react';
import { BotIcon, Loader2Icon, WrenchIcon, ClockIcon, CheckCircleIcon, BrainIcon } from './CustomMCPIcons';
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

interface AIChatProps {
  servers: MCPServer[];
  tools: MCPTool[];
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  availableModels: OpenAIModel[];
  openrouterModels: OpenRouterModel[];
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error', icon: string) => void;
  isVectorVault?: boolean; // Add this line
}

export const AIChat = ({ servers, tools, settings, onSettingsChange, availableModels, openrouterModels, onLog, isVectorVault = false }: AIChatProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const { sessions, currentSessionId: activeSessionId, createSession, loadMessages: switchSession, messages, setMessages, saveMessage } = useChatSessions();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { knowledgeBases } = useContext(AppContext);
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  let currentApiKey = '';
  switch (settings.provider) {
    case 'openai': currentApiKey = settings.openaiApiKey; break;
    case 'openrouter': currentApiKey = settings.openrouterApiKey; break;
    case 'gemini': currentApiKey = settings.geminiApiKey; break;
    case 'anthropic': currentApiKey = settings.anthropicApiKey; break;
    case 'deepseek': currentApiKey = settings.deepseekApiKey; break;
    case 'perplexity': currentApiKey = settings.perplexityApiKey; break;
    case 'grok': currentApiKey = settings.grokApiKey; break;
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (activeSessionId) saveMessage(userMessage, activeSessionId);
    setInputMessage('');
    setIsProcessing(true);

    if (isVectorVault) {
      try {
        const responseText = await geminiService.generateChatResponse(newMessages);
        const botMessage: ChatMessage = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error generating response from VectorVault Gemini service:', error);
        const errorMessage: ChatMessage = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error. Please check the console for details.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
        return;
      }
    }

    // This is a simulated response for when there is no API key in SynapseCore
    const simulatedResponse = () => {
      const botMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: 'I am in simulated mode. Please provide an API key to connect to the live AI model.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsProcessing(false);
    };

    if (!currentApiKey) {
      return simulatedResponse();
    }

    let augmentedPrompt = inputMessage;
    if (selectedKbId) {
      try {
        augmentedPrompt = await vectorRetrievalService.generateRAGPrompt(settings.systemPrompt, selectedKbId, inputMessage);
        toast({ title: "Context Augmented", description: `Prompt has been augmented with context from the selected vector base.` });
      } catch (error) {
        console.error("Failed to augment prompt:", error);
        toast({ title: "Vector Retrieval Failed", description: String(error), variant: "destructive" });
      }
    }

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date(),
      toolCalls: [],
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // This is where you would call your actual AI service
    // For now, we'll simulate a response.
    setTimeout(() => {
      const simulatedResponse = {
        ...assistantMessage,
        content: `This is a simulated response to: "${inputMessage}". The full prompt was: "${augmentedPrompt}"`,
      };
      setMessages((prev) => prev.map((msg) => (msg.id === simulatedResponse.id ? simulatedResponse : msg)));
      if (activeSessionId) saveMessage(simulatedResponse, activeSessionId);
      setIsProcessing(false);
    }, 2000);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(text);
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  const canSendMessage = () => {
    if (isVectorVault) {
      return inputMessage.trim() !== '' && !isProcessing;
    }
    return inputMessage.trim() !== '' && !isProcessing && !!currentApiKey;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BrainIcon className="h-6 w-6 text-indigo-400" />
              AI Chat
            </CardTitle>
            <CardDescription>Interact with AI, tools, and vector bases.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(sessionId) => switchSession(sessionId)} value={activeSessionId || ''}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => createSession()} size="sm">
              <Plus className="h-4 w-4 mr-2" /> New Chat
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0">
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BotIcon className="text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] p-3 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <h4 className="font-semibold text-xs">Tool Calls:</h4>
                      {message.toolCalls.map((call, callIndex) => (
                        <div key={callIndex} className="p-2 bg-background/50 rounded-md text-xs">
                          <div className="flex items-center gap-2">
                            <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono">{call.name}</span>
                          </div>
                          <pre className="text-xs mt-1 p-1 bg-black rounded-md text-white overflow-x-auto">{JSON.stringify(call.arguments, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground/80">
                      <ClockIcon className="inline-block h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </span>
                    <div className="flex gap-2">
                      {message.role === 'assistant' && selectedKbId && (
                        <SaveToVaultButton content={message.content} selectedKbId={selectedKbId} />
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(message.content)}>
                        {copiedMessage === message.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isProcessing && messages.length > 0 && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BotIcon className="text-primary" />
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                        <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <VectorBaseSelector
              selectedKbId={selectedKbId}
              onSelectKb={setSelectedKbId}
              className="flex-shrink-0"
            />
            {selectedKbId && (
              <Badge variant="outline" className="text-indigo-400 border-indigo-400/50">
                Vector base selected
              </Badge>
            )}
          </div>
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
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {/* Status Messages */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
            {!isVectorVault && !currentApiKey && (
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