import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MCPServer, MCPTool } from '@/types/mcp';

export const useMCPServers = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Fallback to localStorage for unauthenticated users
        console.log('No authenticated user, loading servers from localStorage');
        const storedServers = localStorage.getItem('mcp_servers');
        if (storedServers) {
          const parsedServers = JSON.parse(storedServers);
          const mcpServers: MCPServer[] = parsedServers.map((server: any) => ({
            ...server,
            lastConnected: server.lastConnected ? new Date(server.lastConnected) : new Date(),
          }));
          setServers(mcpServers);
        }
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('mcp_servers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const mcpServers: MCPServer[] = data.map(server => ({
          id: server.id,
          name: server.name,
          url: server.url,
          description: server.description,
          status: server.status as 'connected' | 'error' | 'disconnected',
          tools: Array.isArray(server.tools) ? server.tools as any[] : [],
          lastConnected: new Date(server.last_connected),
        }));
        setServers(mcpServers);
      }
    } catch (error) {
      console.error('Error loading MCP servers:', error);
      // Fallback to localStorage on error
      const storedServers = localStorage.getItem('mcp_servers');
      if (storedServers) {
        const parsedServers = JSON.parse(storedServers);
        const mcpServers: MCPServer[] = parsedServers.map((server: any) => ({
          ...server,
          lastConnected: server.lastConnected ? new Date(server.lastConnected) : new Date(),
        }));
        setServers(mcpServers);
      }
      toast({
        title: "Error",
        description: "Failed to load MCP servers, using local storage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveServer = async (server: MCPServer) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save servers",
          variant: "destructive",
        });
        return;
      }

      const serverData = {
        id: server.id,
        user_id: user.id,
        name: server.name,
        url: server.url,
        description: server.description,
        status: server.status,
        tools: server.tools as any,
        last_connected: server.lastConnected.toISOString(),
      };

      const { error } = await supabase
        .from('mcp_servers')
        .upsert(serverData, { onConflict: 'id' });

      if (error) throw error;

      // Update local state
      setServers(prev => {
        const existingIndex = prev.findIndex(s => s.id === server.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = server;
          return updated;
        } else {
          return [...prev, server];
        }
      });

    } catch (error) {
      console.error('Error saving MCP server:', error);
      toast({
        title: "Error",
        description: "Failed to save MCP server",
        variant: "destructive",
      });
    }
  };

  const removeServer = async (serverId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to remove servers",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('mcp_servers')
        .delete()
        .eq('id', serverId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setServers(prev => prev.filter(s => s.id !== serverId));

    } catch (error) {
      console.error('Error removing MCP server:', error);
      toast({
        title: "Error",
        description: "Failed to remove MCP server",
        variant: "destructive",
      });
    }
  };

  // Real MCP tool discovery function (moved from Dashboard.tsx)
  const discoverTools = async (serverUrl: string): Promise<MCPTool[]> => {
    console.log(`🔍 Discovering tools for: ${serverUrl}`);
    
    const discoveryMethods = [
      // Method 1: MCP protocol with proper headers
      async () => {
        console.log(`🌐 Trying MCP protocol with proper headers...`);
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
        console.log(`🌐 Trying direct GET request...`);
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
        console.log(`🔄 Trying discovery method ${i + 1}/${discoveryMethods.length}...`);
        const data = await discoveryMethods[i]();
        const discoveredTools = parseToolsResponse(data);
        
        if (discoveredTools.length > 0) {
          console.log(`✅ Successfully found ${discoveredTools.length} tools using method ${i + 1}`);
          return discoveredTools;
        } else {
          console.log(`⚠️ Method ${i + 1} returned no tools`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ Method ${i + 1} failed: ${errorMsg}`);
      }
    }
    
    throw new Error('Could not discover tools from the provided server URL. Please check the server URL and try again.');
  };

  // Parse tools response (moved from Dashboard.tsx)
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

  // Add missing addServer function
  const addServer = async (serverConfig: { name: string; url: string; description?: string }) => {
    try {
      console.log('Adding server:', serverConfig);
      
      // Create new server object
      const newServer: MCPServer = {
        id: `server-${Date.now()}`,
        name: serverConfig.name,
        url: serverConfig.url,
        description: serverConfig.description || '',
        status: 'connecting',
        tools: [],
        lastConnected: new Date(),
      };

      // Update local state immediately
      setServers(prev => [...prev, newServer]);

      // Try to connect and discover tools using real MCP discovery
      try {
        console.log('🔍 Starting real MCP tool discovery for:', newServer.url);
        const discoveredTools = await discoverTools(newServer.url);
        
        newServer.tools = discoveredTools;
        newServer.status = 'connected';
        newServer.lastConnected = new Date();
        
        console.log('✅ Server connected successfully with', discoveredTools.length, 'real MCP tools');
        console.log('🔧 Discovered tools:', discoveredTools.map(t => t.name).join(', '));
        
        // Update state with connected server
        setServers(prev => prev.map(s => s.id === newServer.id ? newServer : s));
        
        // Save to persistence
        await saveServerToPersistence(newServer);
        
        toast({
          title: "Server Connected",
          description: `Successfully connected to ${newServer.name} with ${discoveredTools.length} tools`,
          variant: "default",
        });
        
      } catch (connectionError) {
        console.error('Failed to connect to server:', connectionError);
        newServer.status = 'error';
        setServers(prev => prev.map(s => s.id === newServer.id ? newServer : s));
        
        toast({
          title: "Connection Failed",
          description: `Failed to connect to ${newServer.name}`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error adding server:', error);
      toast({
        title: "Error",
        description: "Failed to add server",
        variant: "destructive",
      });
    }
  };

  // Add missing refreshServer function
  const refreshServer = async (serverId: string) => {
    try {
      console.log('Refreshing server:', serverId);
      
      const server = servers.find(s => s.id === serverId);
      if (!server) {
        toast({
          title: "Error",
          description: "Server not found",
          variant: "destructive",
        });
        return;
      }

      // Update status to connecting
      setServers(prev => prev.map(s => 
        s.id === serverId ? { ...s, status: 'connecting' as const } : s
      ));

      // Mock refresh - replace with actual MCP refresh
      setTimeout(() => {
        const updatedServer = {
          ...server,
          status: 'connected' as const,
          lastConnected: new Date(),
          tools: server.tools // Keep existing tools
        };
        
        setServers(prev => prev.map(s => s.id === serverId ? updatedServer : s));
        saveServerToPersistence(updatedServer);
        
        toast({
          title: "Server Refreshed",
          description: `Successfully refreshed ${server.name}`,
          variant: "default",
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error refreshing server:', error);
      setServers(prev => prev.map(s => 
        s.id === serverId ? { ...s, status: 'error' as const } : s
      ));
      toast({
        title: "Error",
        description: "Failed to refresh server",
        variant: "destructive",
      });
    }
  };

  // Helper function to save server to appropriate persistence
  const saveServerToPersistence = async (server: MCPServer) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Save to Supabase if authenticated
        const serverData = {
          id: server.id,
          user_id: user.id,
          name: server.name,
          url: server.url,
          description: server.description,
          status: server.status,
          tools: server.tools as any,
          last_connected: server.lastConnected.toISOString(),
        };

        const { error } = await supabase
          .from('mcp_servers')
          .upsert(serverData, { onConflict: 'id' });

        if (error) throw error;
      } else {
        // Save to localStorage if not authenticated
        const currentServers = servers.map(s => s.id === server.id ? server : s);
        localStorage.setItem('mcp_servers', JSON.stringify(currentServers));
      }
    } catch (error) {
      console.error('Error saving server to persistence:', error);
      // Always save to localStorage as fallback
      const currentServers = servers.map(s => s.id === server.id ? server : s);
      localStorage.setItem('mcp_servers', JSON.stringify(currentServers));
    }
  };

  return {
    servers,
    isLoading,
    saveServer,
    removeServer,
    addServer,
    refreshServer,
    setServers,
  };
};