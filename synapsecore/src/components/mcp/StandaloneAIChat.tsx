import React from 'react';
import { AIChat } from './AIChat';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useAISettings } from '@/hooks/useAISettings';
import { MCPTool, OpenAIModel, OpenRouterModel } from '@/types/mcp';

const StandaloneAIChat: React.FC = () => {
  const { servers } = useMCPServers();
  const { settings, saveSettings } = useAISettings();
  
  // Aggregate tools from all connected servers
  const tools = React.useMemo(() => {
    const allTools: MCPTool[] = [];
    
    servers.forEach((server) => {
      if (server.tools && server.tools.length > 0) {
        const serverTools = server.tools.map(tool => ({
          ...tool,
          serverUrl: server.url,
          serverId: server.id,
          category: tool.category || 'utility'
        }));
        allTools.push(...serverTools);
      }
    });
    
    return allTools;
  }, [servers]);

  // Available models
  const availableModels: OpenAIModel[] = [
    { id: 'gpt-4', name: 'GPT-4', context_window: 8192 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', context_window: 128000 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context_window: 16384 },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', context_window: 200000 },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', context_window: 180000 },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', context_window: 150000 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', context_window: 1000000 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context_window: 1000000 },
  ];

  const openrouterModels: OpenRouterModel[] = [];

  const handleSettingsChange = (newSettings: typeof settings) => {
    saveSettings(newSettings);
  };

  const handleLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', icon = '') => {
    console.log(`[${type}] ${icon} ${message}`);
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold text-white mb-2">AI Chat</h1>
      <p className="text-gray-400 mb-6">Chat with AI using your connected tools and knowledge bases.</p>
      
      <div className="flex-1 bg-background-light rounded-lg p-4 shadow-md">
        <AIChat
          servers={servers}
          tools={tools}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          availableModels={availableModels}
          openrouterModels={openrouterModels}
          onLog={handleLog}
        />
      </div>
    </div>
  );
};

export default StandaloneAIChat;
