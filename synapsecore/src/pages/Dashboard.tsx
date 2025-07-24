import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { MCPTool, LogEntry, MCPServer } from '@/types/mcp';
import { MCPServerForm } from '@/components/mcp/MCPServerForm';
import { ConnectedServers } from '@/components/mcp/ConnectedServers';
import { AvailableTools } from '@/components/mcp/AvailableTools';
import { ActivityLog } from '@/components/mcp/ActivityLog';
import { useMCPServers } from '@/hooks/useMCPServers';

const Dashboard = () => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  const { 
    servers, 
    removeServer, 
    addServer,
    refreshServer,
    isLoading
  } = useMCPServers();

  // Aggregate tools from all connected servers
  useEffect(() => {
    console.log('🔧 Dashboard: Starting tool aggregation...');
    console.log('🔧 Dashboard: Servers data:', servers);
    console.log('🔧 Dashboard: Number of servers:', servers.length);
    
    const allTools: MCPTool[] = [];
    
    servers.forEach((server, index) => {
      console.log(`🔧 Dashboard: Processing server ${index + 1}:`, {
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
        console.log(`🔧 Dashboard: Added ${serverTools.length} tools from server ${server.name}`);
        console.log('🔧 Dashboard: Sample tool:', serverTools[0]);
      } else {
        console.log(`🔧 Dashboard: Server ${server.name} has no tools or empty tools array`);
      }
    });
    
    console.log('🔧 Dashboard: Final aggregated tools:', allTools.length);
    console.log('🔧 Dashboard: All tools data:', allTools);
    setTools(allTools);
    
    // Force re-render by logging current tools state
    setTimeout(() => {
      console.log('🔧 Dashboard: Tools state after setState:', allTools.length);
    }, 100);
  }, [servers]);
  
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [refreshingServer, setRefreshingServer] = useState<string | undefined>();

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', icon?: string, source?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      type,
      icon: icon || '',
      source,
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  }, []);

  const discoverTools = async (serverUrl: string): Promise<MCPTool[]> => {
    addLog(`🔍 Discovering tools for: ${serverUrl}`, 'info', '🔍', 'Tool Discovery');
    
    const discoveryMethods = [
      // Method 1: MCP protocol with proper headers
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
        
        if (contentType?.includes('text/event-stream')) {
          const text = await response.text();
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
            return jsonData;
          } else {
            throw new Error('No valid JSON data found in SSE response');
          }
        } else {
          const data = await response.json();
          return data;
        }
      },
      
      // Method 2: Direct GET request
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
    
    throw new Error('Could not discover tools from the provided server URL. Please check the server URL and try again.');
  };

  const parseToolsResponse = (data: any): MCPTool[] => {
    let discoveredTools: MCPTool[] = [];
    
    if (data.tools && Array.isArray(data.tools)) {
      discoveredTools = data.tools;
    } else if (data.result && Array.isArray(data.result.tools)) {
      discoveredTools = data.result.tools;
    } else if (Array.isArray(data)) {
      discoveredTools = data;
    } else if (data.result && Array.isArray(data.result)) {
      discoveredTools = data.result;
    }
    
    return discoveredTools.map(tool => ({
      name: tool.name || 'unnamed_tool',
      description: tool.description || 'No description available',
      category: tool.category || 'utility',
      parameters: tool.parameters || tool.inputSchema,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema
    }));
  };

  const handleAddServer = async (nameOrData: string | { name: string; url: string; description?: string }, url?: string, description?: string) => {
    setIsAddingServer(true);
    
    // Handle both object and individual parameter patterns
    let serverData: { name: string; url: string; description?: string };
    if (typeof nameOrData === 'object') {
      serverData = nameOrData;
    } else {
      serverData = { name: nameOrData, url: url!, description };
    }
    
    addLog(`📝 Adding MCP server: ${serverData.name} (${serverData.url})`, 'info', '📝', 'Server Management');
    
    try {
      // Use the new addServer function from useMCPServers hook
      await addServer(serverData);
      
      addLog(`✅ Server added successfully: ${serverData.name}`, 'success', '✅', 'Server Management');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Failed to add server: ${errorMsg}`, 'error', '❌', 'Server Management');
      toast({
        title: "Connection Failed", 
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsAddingServer(false);
    }
  };

  const handleRemoveServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    try {
      await removeServer(serverId);
      
      // Remove tools from state
      setTools(prev => prev.filter(tool => tool.serverId !== serverId));
      
      addLog(`🗑️ Server removed: ${server.name}`, 'info', '🗑️', 'Server Management');
      toast({
        title: "Server Removed",
        description: `Successfully removed ${server.name}`,
      });
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Failed to remove server: ${errorMsg}`, 'error', '❌', 'Server Management');
      toast({
        title: "Remove Failed",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  const handleRefreshServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    setRefreshingServer(serverId);
    addLog(`🔄 Refreshing server: ${server.name}`, 'info', '🔄', 'Server Management');
    
    try {
      // Use the new refreshServer function from useMCPServers hook
      await refreshServer(serverId);
      
      addLog(`✅ Server refreshed: ${server.name}`, 'success', '✅', 'Server Management');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Server refresh failed: ${errorMsg}`, 'error', '❌', 'Server Management');
    } finally {
      setRefreshingServer(undefined);
    }
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

  const badges = {
    servers: servers.length,
    tools: tools.length,
    logs: logs.length,
  };
  
  // Debug: Log current state
  console.log('🔧 Dashboard render: Current state:', {
    serversCount: servers.length,
    toolsCount: tools.length,
    logsCount: logs.length
  });

  return (
    <div className="h-full flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-6">Manage your servers, tools, and view activity.</p>
        <Tabs defaultValue="servers" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-background-light rounded-lg shadow-inner-shadow mb-6">
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
            <TabsTrigger value="logs" className="flex items-center justify-center">
              <span className="mr-1">📜</span> Activity
              <Badge variant="secondary" className="ml-1 text-xs">
                {badges.logs}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servers" className="space-y-6 flex-1">
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

          <TabsContent value="tools" className="space-y-6 flex-1">
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

          <TabsContent value="logs" className="space-y-6 flex-1 flex flex-col">
            <ActivityLog 
              logs={logs}
              onClearLog={handleClearLog}
              onExportLog={handleExportLog}
            />
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default Dashboard;
