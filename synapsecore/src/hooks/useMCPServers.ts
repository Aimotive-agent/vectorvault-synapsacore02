import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mcpClient, MCPTool as SDKMCPTool, MCPConnectionResult } from '../services/mcpClient';
import { MCPServer, MCPTool } from '@/types/mcp';

// Custom hook for managing MCP servers using the official MCP SDK
export const useMCPServers = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [discoveredTools, setDiscoveredTools] = useState<MCPTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load servers from localStorage on mount
  useEffect(() => {
    const loadServers = () => {
      try {
        const savedServers = localStorage.getItem('mcpServers');
        if (savedServers) {
          const parsedServers = JSON.parse(savedServers);
          console.log('📂 Loaded servers from localStorage:', parsedServers);
          setServers(parsedServers);
          
          // Aggregate tools from all loaded servers
          const allTools = parsedServers.reduce((acc: MCPTool[], server: MCPServer) => {
            return [...acc, ...(server.tools || [])];
          }, []);
          setDiscoveredTools(allTools);
        }
      } catch (error) {
        console.error('❌ Error loading servers from localStorage:', error);
      }
    };

    loadServers();
  }, []);

  // Save servers to localStorage whenever servers change
  const saveServers = useCallback((newServers: MCPServer[]) => {
    try {
      localStorage.setItem('mcpServers', JSON.stringify(newServers));
      console.log('💾 Saved servers to localStorage:', newServers);
    } catch (error) {
      console.error('❌ Error saving servers to localStorage:', error);
    }
  }, []);

  // MCP tool discovery using official SDK (based on Genspark's working implementation)
  const discoverTools = async (serverUrl: string): Promise<MCPTool[]> => {
    console.log(`🔍 Discovering tools using MCP SDK for: "${serverUrl}"`);
    console.log(`🔍 Server URL type: ${typeof serverUrl}, length: ${serverUrl?.length}`);
    
    // Validate server URL
    if (!serverUrl || typeof serverUrl !== 'string' || serverUrl.trim() === '') {
      console.error('❌ Invalid server URL provided:', serverUrl);
      throw new Error('Invalid server URL provided');
    }
    
    const cleanUrl = serverUrl.trim();
    console.log(`🔍 Using clean URL with MCP SDK: "${cleanUrl}"`);
    
    try {
      // Use the MCP SDK client to connect and discover tools
      const result: MCPConnectionResult = await mcpClient.connectToMCP(cleanUrl, `server-${Date.now()}`);
      
      if (result.success && result.tools) {
        console.log(`🎉 MCP SDK successfully discovered ${result.tools.length} tools!`);
        
        // Convert SDK tools to our MCPTool format
        const convertedTools: MCPTool[] = result.tools.map((tool: SDKMCPTool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          category: tool.category || 'MCP Tool'
        }));
        
        return convertedTools;
      } else {
        console.error('❌ MCP SDK connection failed:', result.error);
        throw new Error(result.error || 'Failed to connect to MCP server');
      }
    } catch (error: any) {
      console.error('❌ MCP SDK discovery error:', error);
      throw new Error(`MCP discovery failed: ${error.message}`);
    }
  };

  // Add a new MCP server
  const addServer = async (serverData: { name: string; url: string; description?: string }) => {
    const { name, url, description } = serverData;
    console.log(`➕ Adding MCP server: ${name} at ${url}`);
    setIsLoading(true);

    try {
      // Discover tools using MCP SDK
      const tools = await discoverTools(url);
      
      const newServer: MCPServer = {
        id: `server-${Date.now()}`,
        name,
        url,
        description: description || '',
        status: 'connected',
        tools,
        lastConnected: new Date()
      };

      const updatedServers = [...servers, newServer];
      setServers(updatedServers);
      saveServers(updatedServers);

      // Update discovered tools
      const allTools = updatedServers.reduce((acc: MCPTool[], server: MCPServer) => {
        return [...acc, ...(server.tools || [])];
      }, []);
      setDiscoveredTools(allTools);

      toast({
        title: "Server Connected",
        description: `Successfully connected to ${name} and discovered ${tools.length} tools.`,
      });

      console.log(`✅ Successfully added server: ${name} with ${tools.length} tools`);
      return newServer;
    } catch (error: any) {
      console.error(`❌ Failed to add server ${name}:`, error);
      
      toast({
        title: "Connection Failed",
        description: error.message || `Failed to connect to ${name}`,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh an existing server
  const refreshServer = async (serverId: string) => {
    console.log(`🔄 Refreshing server: ${serverId}`);
    setIsLoading(true);

    try {
      const serverToRefresh = servers.find(s => s.id === serverId);
      if (!serverToRefresh) {
        throw new Error('Server not found');
      }

      // Rediscover tools using MCP SDK
      const tools = await discoverTools(serverToRefresh.url);
      
      const updatedServers = servers.map(server => 
        server.id === serverId 
          ? { 
              ...server, 
              tools, 
              status: 'connected' as const,
              lastConnected: new Date() 
            }
          : server
      );

      setServers(updatedServers);
      saveServers(updatedServers);

      // Update discovered tools
      const allTools = updatedServers.reduce((acc: MCPTool[], server: MCPServer) => {
        return [...acc, ...(server.tools || [])];
      }, []);
      setDiscoveredTools(allTools);

      toast({
        title: "Server Refreshed",
        description: `Successfully refreshed ${serverToRefresh.name} and discovered ${tools.length} tools.`,
      });

      console.log(`✅ Successfully refreshed server: ${serverToRefresh.name} with ${tools.length} tools`);
    } catch (error: any) {
      console.error(`❌ Failed to refresh server ${serverId}:`, error);
      
      // Mark server as disconnected
      const updatedServers = servers.map(server => 
        server.id === serverId 
          ? { ...server, status: 'disconnected' as const }
          : server
      );
      setServers(updatedServers);
      saveServers(updatedServers);

      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a server
  const removeServer = useCallback((serverId: string) => {
    console.log(`🗑️ Removing server: ${serverId}`);
    
    const updatedServers = servers.filter(server => server.id !== serverId);
    setServers(updatedServers);
    saveServers(updatedServers);

    // Update discovered tools
    const allTools = updatedServers.reduce((acc: MCPTool[], server: MCPServer) => {
      return [...acc, ...(server.tools || [])];
    }, []);
    setDiscoveredTools(allTools);

    // Disconnect from MCP client if needed
    mcpClient.disconnectServer(serverId);

    toast({
      title: "Server Removed",
      description: "Server has been removed successfully.",
    });
  }, [servers, saveServers, toast]);

  // Execute a tool using MCP SDK
  const executeTool = async (toolName: string, parameters: any) => {
    console.log(`🔧 Executing tool: ${toolName} with parameters:`, parameters);
    
    try {
      const result = await mcpClient.executeTool(toolName, parameters);
      console.log(`✅ Tool execution result:`, result);
      return result;
    } catch (error: any) {
      console.error(`❌ Tool execution failed:`, error);
      throw error;
    }
  };

  return {
    servers,
    discoveredTools,
    isLoading,
    addServer,
    refreshServer,
    removeServer,
    executeTool,
    discoverTools
  };
};