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
  const { sessions, activeSessionId, createSession, switchSession, addMessageToSession, updateMessageInSession } = useChatSessions();
  const { selectedKbId, setSelectedKbId } = useContext(AppContext);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentApiKey = settings.provider === 'openai' ? settings.apiKey : settings.openrouterApiKey;

  const activeMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];

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

    addMessageToSession(activeSessionId, userMessage);
    setInputMessage('');
    setIsProcessing(true);

    try {
      let context = '';
      if (selectedKbId) {
        onLog('Retrieving context from Vector Vault...', 'info', '🧠');
        const searchResult = await vectorRetrievalService.search(selectedKbId, userMessage.content);
        if (searchResult && searchResult.length > 0) {
          context = searchResult.map(r => r.text).join('\n\n');
          onLog(`Retrieved ${searchResult.length} context chunks.`, 'success', '🧠');
        } else {
          onLog('No relevant context found in Vector Vault.', 'warning', '🧠');
        }
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        toolCalls: [],
      };
      addMessageToSession(activeSessionId, botMessage);

      const stream = await geminiService.generateResponse(userMessage.content, context);
      
      let accumulatedContent = '';
      for await (const chunk of stream) {
        accumulatedContent += chunk;
        updateMessageInSession(activeSessionId, botMessage.id, { content: accumulatedContent });
      }

    } catch (error: any) {
      const errorMessage = `Error: ${error.message || 'An unexpected error occurred.'}`;
      const errorBotMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      addMessageToSession(activeSessionId, errorBotMessage);
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
          {activeMessages.map((message) => (
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
          {isProcessing && activeMessages[activeMessages.length - 1]?.role === 'user' && (
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