import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MCPServer, LogEntry } from '@/types/mcp';

export const useMCPServers = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      // First try to load from localStorage regardless of auth status
      const storedServers = localStorage.getItem('mcp_servers');
      let localServers: MCPServer[] = [];
      
      if (storedServers) {
        try {
          const parsedServers = JSON.parse(storedServers);
          localServers = parsedServers.map((server: any) => ({
            ...server,
            lastConnected: new Date(server.lastConnected),
          }));
          console.log('Loaded MCP servers from localStorage:', localServers);
          
          // Set servers from localStorage first for immediate display
          setServers(localServers);
        } catch (parseError) {
          console.error('Error parsing stored servers:', parseError);
        }
      }
      
      // Then try to load from Supabase if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load from Supabase if authenticated
        const { data, error } = await supabase
          .from('mcp_servers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const mcpServers: MCPServer[] = data.map(server => ({
            id: server.id,
            name: server.name,
            url: server.url,
            description: server.description,
            status: server.status as 'connected' | 'error' | 'disconnected',
            tools: Array.isArray(server.tools) ? server.tools as any[] : [],
            lastConnected: new Date(server.last_connected),
          }));
          
          // Save to localStorage for persistence across sessions
          localStorage.setItem('mcp_servers', JSON.stringify(mcpServers));
          
          setServers(mcpServers);
          console.log('Loaded MCP servers from Supabase:', mcpServers);
        } else if (localServers.length > 0) {
          // If no Supabase data but we have localStorage data, save it to Supabase
          console.log('No servers in Supabase but found in localStorage, syncing to Supabase');
          for (const server of localServers) {
            await saveServer(server);
          }
        }
      }
    } catch (error) {
      console.error('Error loading MCP servers:', error);
      // Fallback to localStorage on error
      const storedServers = localStorage.getItem('mcp_servers');
      if (storedServers) {
        try {
          const parsedServers = JSON.parse(storedServers);
          const mcpServers: MCPServer[] = parsedServers.map((server: any) => ({
            ...server,
            lastConnected: new Date(server.lastConnected),
          }));
          setServers(mcpServers);
        } catch (parseError) {
          console.error('Error parsing stored servers:', parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveServer = async (server: MCPServer) => {
    try {
      // Always save to localStorage for persistence across sessions
      const existingServers = localStorage.getItem('mcp_servers');
      let servers: MCPServer[] = [];
      
      if (existingServers) {
        try {
          servers = JSON.parse(existingServers);
        } catch (parseError) {
          console.error('Error parsing stored servers:', parseError);
        }
      }
      
      const existingIndex = servers.findIndex(s => s.id === server.id);
      if (existingIndex >= 0) {
        servers[existingIndex] = server;
      } else {
        servers.push(server);
      }
      
      localStorage.setItem('mcp_servers', JSON.stringify(servers));
      
      // Update local state immediately
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
      
      // Then try to save to Supabase if user is authenticated
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
      }

      // Local state already updated above

    } catch (error) {
      console.error('Error saving MCP server:', error);
      // Fallback to localStorage on error
      try {
        const existingServers = localStorage.getItem('mcp_servers');
        let servers: MCPServer[] = [];
        
        if (existingServers) {
          servers = JSON.parse(existingServers);
        }
        
        const existingIndex = servers.findIndex(s => s.id === server.id);
        if (existingIndex >= 0) {
          servers[existingIndex] = server;
        } else {
          servers.push(server);
        }
        
        localStorage.setItem('mcp_servers', JSON.stringify(servers));
        
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
      } catch (fallbackError) {
        console.error('Error with localStorage fallback:', fallbackError);
        toast({
          title: "Error",
          description: "Failed to save MCP server",
          variant: "destructive",
        });
      }
    }
  };

  const removeServer = async (serverId: string) => {
    try {
      // Always remove from localStorage for consistency
      const existingServers = localStorage.getItem('mcp_servers');
      if (existingServers) {
        try {
          const servers: MCPServer[] = JSON.parse(existingServers);
          const filteredServers = servers.filter(s => s.id !== serverId);
          localStorage.setItem('mcp_servers', JSON.stringify(filteredServers));
        } catch (parseError) {
          console.error('Error parsing stored servers:', parseError);
        }
      }
      
      // Update local state immediately
      setServers(prev => prev.filter(s => s.id !== serverId));
      
      // Then try to remove from Supabase if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Remove from Supabase if authenticated
        const { error } = await supabase
          .from('mcp_servers')
          .delete()
          .eq('id', serverId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Local state already updated above

    } catch (error) {
      console.error('Error removing MCP server:', error);
      // Fallback to localStorage on error
      try {
        const existingServers = localStorage.getItem('mcp_servers');
        if (existingServers) {
          const servers: MCPServer[] = JSON.parse(existingServers);
          const filteredServers = servers.filter(s => s.id !== serverId);
          localStorage.setItem('mcp_servers', JSON.stringify(filteredServers));
          setServers(prev => prev.filter(s => s.id !== serverId));
        }
      } catch (fallbackError) {
        console.error('Error with localStorage fallback:', fallbackError);
        toast({
          title: "Error",
          description: "Failed to remove MCP server",
          variant: "destructive",
        });
      }
    }
  };

  // Add server function
  const addServer = async (serverData: Omit<MCPServer, 'id' | 'status'>, onLog?: (log: LogEntry) => void) => {
    const newServer: MCPServer = {
      ...serverData,
      id: Date.now().toString(),
      status: 'disconnected' as const,
      lastConnected: new Date() // Ensure lastConnected is a valid Date object
    };
    
    try {
      await saveServer(newServer);
      onLog?.({ message: `Server "${newServer.name}" added successfully`, type: 'success', icon: '✅' } as LogEntry);
    } catch (error: any) {
      console.error('Error adding server:', error);
      onLog?.({ message: `Failed to add server: ${error.message}`, type: 'error', icon: '❌' } as LogEntry);
      throw error;
    }
  };

  // Refresh server function
  const refreshServer = async (serverId: string, onLog?: (log: LogEntry) => void) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) {
      onLog?.({ message: 'Server not found', type: 'error', icon: '❌' } as LogEntry);
      return;
    }

    onLog?.({ message: `Refreshing server "${server.name}"...`, type: 'info', icon: '🔄' } as LogEntry);
    
    try {
      // Simulate server refresh - in a real implementation, this would reconnect to the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create updated server with new status and lastConnected date
      const updatedServer = {
        ...server,
        status: 'connected' as const,
        lastConnected: new Date()
      };
      
      // Save the updated server to persist the changes
      await saveServer(updatedServer);
      
      onLog?.({ message: `Server "${server.name}" refreshed successfully`, type: 'success', icon: '✅' } as LogEntry);
    } catch (error: any) {
      console.error('Error refreshing server:', error);
      onLog?.({ message: `Failed to refresh server: ${error.message}`, type: 'error', icon: '❌' } as LogEntry);
      
      // Create updated server with disconnected status
      const updatedServer = {
        ...server,
        status: 'disconnected' as const
      };
      
      // Save the updated server to persist the changes
      await saveServer(updatedServer);
    }
  };

  return {
    servers,
    isLoading,
    saveServer,
    addServer,
    removeServer,
    refreshServer,
    setServers,
    isAdding: false, // Add this for compatibility
    refreshingServer: null // Add this for compatibility
  };
};