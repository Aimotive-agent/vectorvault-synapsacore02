import { useState, useCallback } from 'react';
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
    addServer, 
    removeServer, 
    refreshServer, 
    isAdding: isAddingServer, 
    refreshingServer 
  } = useMCPServers();

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
