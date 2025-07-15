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

  // Comprehensive model lists that match the ones in individual components
  const availableModels = [
    { id: 'gpt-4o', name: 'GPT-4o', context_window: 128000, pricing: { input: 0.005, output: 0.015 } },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context_window: 128000, pricing: { input: 0.00015, output: 0.0006 } },
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', context_window: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-4', name: 'GPT-4', context_window: 8192, pricing: { input: 0.03, output: 0.06 } },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context_window: 16385, pricing: { input: 0.001, output: 0.002 } },
  ];

  const openrouterModels = [
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', context_length: 200000, pricing: { prompt: 0.015, completion: 0.075 } },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', context_length: 200000, pricing: { prompt: 0.003, completion: 0.015 } },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', context_length: 200000, pricing: { prompt: 0.00025, completion: 0.00125 } },
    { id: 'openai/gpt-4o', name: 'GPT-4o', context_length: 128000, pricing: { prompt: 0.005, completion: 0.015 } },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', context_length: 128000, pricing: { prompt: 0.00015, completion: 0.0006 } },
    { id: 'google/gemini-pro', name: 'Gemini Pro', context_length: 32768, pricing: { prompt: 0.0005, completion: 0.0015 } },
    { id: 'meta-llama/llama-2-70b-chat', name: 'Llama 2 70B', context_length: 4096, pricing: { prompt: 0.0007, completion: 0.0009 } },
    { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', context_length: 32768, pricing: { prompt: 0.00013, completion: 0.00013 } },
    { id: 'nousresearch/nous-hermes-llama2-13b', name: 'Nous Hermes Llama2 13B', context_length: 4096, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'phind/phind-codellama-34b', name: 'Phind CodeLlama 34B', context_length: 16384, pricing: { prompt: 0.0007, completion: 0.0007 } },
    { id: 'wizardlm/wizardlm-70b', name: 'WizardLM 70B', context_length: 2048, pricing: { prompt: 0.00081, completion: 0.00081 } },
    { id: 'huggingfaceh4/zephyr-7b-beta', name: 'Zephyr 7B Beta', context_length: 32768, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'openchat/openchat-7b', name: 'OpenChat 7B', context_length: 8192, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'teknium/openhermes-2-mistral-7b', name: 'OpenHermes 2 Mistral 7B', context_length: 4096, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'gryphe/mythomist-7b', name: 'MythoMist 7B', context_length: 32768, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'undi95/toppy-m-7b', name: 'Toppy M 7B', context_length: 4096, pricing: { prompt: 0.00018, completion: 0.00018 } },
    { id: 'lizpreciatior/lzlv-70b-fp16-hf', name: 'LZLV 70B', context_length: 4096, pricing: { prompt: 0.00059, completion: 0.00078 } },
    { id: 'alpindale/goliath-120b', name: 'Goliath 120B', context_length: 6144, pricing: { prompt: 0.00938, completion: 0.00938 } },
    { id: 'neversleep/noromaid-mixtral-8x7b-instruct', name: 'Noromaid Mixtral 8x7B', context_length: 8000, pricing: { prompt: 0.008, completion: 0.008 } },
    { id: 'moonshotai/kimi-k2:free', name: 'Moonshot Kimi K2 (Free)', context_length: 128000, pricing: { prompt: 0, completion: 0 } },
  ];

  // Handle settings change with database persistence
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