import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from 'next-themes';
import { MCPTool, LogEntry, MCPServer, AISettings } from '@/types/mcp';
import { MCPServerForm } from './MCPServerForm';
import { ConnectedServers } from './ConnectedServers';
import { AvailableTools } from './AvailableTools';
import { AISettingsCard } from './AISettingsCard';
import AIChatWithVectorVault from './AIChatWithVectorVault';
import { ActivityLog } from './ActivityLog';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useAISettings } from '@/hooks/useAISettings';

export const MCPWorkbench = () => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('servers');
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const { 
    servers, 
    isLoading: serversLoading, 
    addServer, 
    removeServer, 
    refreshServer, 
    isAdding: isAddingServer, 
    refreshingServer 
  } = useMCPServers();
  
  const { settings: aiSettings, saveSettings, setSettings: setAiSettings } = useAISettings();

  // Aggregate tools from all connected servers
  useEffect(() => {
    console.log('🔧 MCPWorkbench: Starting tool aggregation...');
    console.log('🔧 MCPWorkbench: Servers data:', servers);
    console.log('🔧 MCPWorkbench: Number of servers:', servers.length);
    
    const allTools: MCPTool[] = [];
    
    servers.forEach((server, index) => {
      console.log(`🔧 MCPWorkbench: Processing server ${index + 1}:`, {
        name: server.name,
        id: server.id,
        toolsCount: server.tools?.length || 0,
        toolsData: server.tools
      });
      
      if (server.tools && server.tools.length > 0) {
        const serverTools = server.tools.map(tool => ({
          ...tool,
          serverUrl: server.url,
          serverId: server.id,
          category: tool.category || 'utility'
        }));
        allTools.push(...serverTools);
        console.log(`🔧 MCPWorkbench: Added ${serverTools.length} tools from server ${server.name}`);
        console.log('🔧 MCPWorkbench: Sample tool:', serverTools[0]);
      } else {
        console.log(`🔧 MCPWorkbench: Server ${server.name} has no tools or empty tools array`);
      }
    });
    
    console.log('🔧 MCPWorkbench: Final aggregated tools:', allTools.length);
    console.log('🔧 MCPWorkbench: All tools data:', allTools);
    setTools(allTools);
    
    // Force re-render by logging current tools state
    setTimeout(() => {
      console.log('🔧 MCPWorkbench: Tools state after setState:', allTools.length);
    }, 100);
  }, [servers]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', icon?: string, category?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message,
      type,
      icon,
      category,
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  }, []);

  const handleAddServer = async (url: string) => {
    await addServer(url, (log) => addLog(log.message, log.type, log.icon, log.category));
  };

  const handleRemoveServer = async (serverId: string) => {
    await removeServer(serverId, (log) => addLog(log.message, log.type, log.icon, log.category));
  };

  const handleRefreshServer = async (serverId: string) => {
    await refreshServer(serverId, (log) => addLog(log.message, log.type, log.icon, log.category));
  };

  const handleSettingsChange = (newSettings: Partial<AISettings>) => {
    setAiSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
    addLog('AI settings updated.', 'success', '⚙️', 'Settings');
  };

  const handleClearLog = () => {
    setLogs([]);
    addLog('Activity log cleared.', 'info', '🗑️', 'System');
  };

  const handleExportLog = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-log-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Activity log exported.', 'success', '📤', 'System');
  };

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
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo (Preview)', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision (Preview)', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-4', name: 'GPT-4', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    { id: 'gpt-4-32k', name: 'GPT-4 32k', context_window: 32768, pricing: { input: 0.06, output: 0.12 } },

    // GPT-3.5 Family
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context_window: 16385, pricing: { input: 0.0005, output: 0.0015 } },
    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16k', context_window: 16385, pricing: { input: 0.001, output: 0.002 } },
    { id: 'gpt-3.5-turbo-instruct', name: 'GPT-3.5 Turbo Instruct', context_window: 4096, pricing: { input: 0.0015, output: 0.002 } },

    // Specialized Models
    { id: 'dall-e-3', name: 'DALL-E 3', pricing: { standard: 0.040, hd: 0.080, unit: 'image' } },
    { id: 'dall-e-2', name: 'DALL-E 2', pricing: { standard: 0.020, unit: 'image' } },
    { id: 'tts-1-hd', name: 'TTS-1 HD', pricing: { standard: 0.030, unit: '1k_chars' } },
    { id: 'tts-1', name: 'TTS-1', pricing: { standard: 0.015, unit: '1k_chars' } },
    { id: 'whisper-1', name: 'Whisper', pricing: { standard: 0.006, unit: 'minute' } },

    // Fine-tuned Models
    { id: 'babbage-002', name: 'Babbage-002', context_window: 16384, pricing: { training: 0.0004, input: 0.0016, output: 0.0016, unit: '1k_tokens' } },
    { id: 'davinci-002', name: 'Davinci-002', context_window: 16384, pricing: { training: 0.006, input: 0.012, output: 0.012, unit: '1k_tokens' } },
    { id: 'gpt-3.5-turbo-0613-ft', name: 'GPT-3.5 Turbo (Fine-tuned)', context_window: 4096, pricing: { training: 0.008, input: 0.012, output: 0.016, unit: '1k_tokens' } },

    // Legacy Models
    { id: 'text-davinci-003', name: 'Text Davinci 003', context_window: 4097, pricing: { standard: 0.02, unit: '1k_tokens' } },
    { id: 'text-davinci-002', name: 'Text Davinci 002', context_window: 4097, pricing: { standard: 0.02, unit: '1k_tokens' } },
    { id: 'code-davinci-002', name: 'Code Davinci 002', context_window: 8001, pricing: { standard: 0.02, unit: '1k_tokens' } },
    
    // Embedding Models
    { id: 'text-embedding-3-large', name: 'Embedding 3 Large', dimensions: 3072, pricing: { standard: 0.00013, unit: '1k_tokens' } },
    { id: 'text-embedding-3-small', name: 'Embedding 3 Small', dimensions: 1536, pricing: { standard: 0.00002, unit: '1k_tokens' } },
    { id: 'text-embedding-ada-002', name: 'Embedding Ada v2', dimensions: 1536, pricing: { standard: 0.0001, unit: '1k_tokens' } },
  ];

  const openrouterModels = [
    // Add OpenRouter specific models here if needed
  ];

  const badges = {
    servers: servers.length,
    tools: tools.length,
    settings: Object.keys(aiSettings).length > 0 ? 1 : 0,
    chat: 0, // Dynamic badge, e.g., for unread messages
    logs: logs.length,
  };
  
  // Debug: Log current state
  console.log('🔧 MCPWorkbench render: Current state:', {
    serversCount: servers.length,
    toolsCount: tools.length,
    logsCount: logs.length
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-background-dark">
      <div className="max-w-full mx-auto">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-background-light rounded-lg shadow-inner-shadow">
            <TabsTrigger value="servers" className="flex items-center justify-center">
              <span className="mr-1">🌐</span> Servers
              <Badge variant="secondary" className="ml-1 text-xs">
                {badges.servers}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center justify-center">
              <span className="mr-1">🔧</span> Tools
              <Badge variant="secondary" className="ml-1 text-xs">
                {badges.tools}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center justify-center">
              <span className="mr-1">⚙️</span> Settings
              <Badge variant="secondary" className="ml-1 text-xs">
                {badges.settings}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center justify-center">
              <span className="mr-1">💬</span> AI Chat
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center justify-center">
              <span className="mr-1">📜</span> Activity
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
            <AIChatWithVectorVault 
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