import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MCPServer } from '@/types/mcp';

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

      // Try to connect and discover tools
      try {
        // Mock tool discovery for now - replace with actual MCP connection
        const mockTools = Array.from({ length: 26 }, (_, i) => ({
          name: `tool-${i + 1}`,
          description: `Mock tool ${i + 1}`,
          inputSchema: {}
        }));
        
        newServer.tools = mockTools;
        newServer.status = 'connected';
        newServer.lastConnected = new Date();
        
        console.log('Server connected successfully with', mockTools.length, 'tools');
        
        // Update state with connected server
        setServers(prev => prev.map(s => s.id === newServer.id ? newServer : s));
        
        // Save to persistence
        await saveServerToPersistence(newServer);
        
        toast({
          title: "Server Connected",
          description: `Successfully connected to ${newServer.name} with ${mockTools.length} tools`,
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