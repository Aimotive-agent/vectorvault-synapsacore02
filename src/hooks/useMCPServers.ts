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
      
      if (user) {
        // Load from Supabase if authenticated
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
      } else {
        // Load from localStorage if not authenticated
        const storedServers = localStorage.getItem('mcp_servers');
        if (storedServers) {
          const parsedServers = JSON.parse(storedServers);
          const mcpServers: MCPServer[] = parsedServers.map((server: any) => ({
            ...server,
            lastConnected: new Date(server.lastConnected),
          }));
          setServers(mcpServers);
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
      }

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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Remove from Supabase if authenticated
        const { error } = await supabase
          .from('mcp_servers')
          .delete()
          .eq('id', serverId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Remove from localStorage if not authenticated
        const existingServers = localStorage.getItem('mcp_servers');
        if (existingServers) {
          const servers: MCPServer[] = JSON.parse(existingServers);
          const filteredServers = servers.filter(s => s.id !== serverId);
          localStorage.setItem('mcp_servers', JSON.stringify(filteredServers));
        }
      }

      // Update local state
      setServers(prev => prev.filter(s => s.id !== serverId));

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

  return {
    servers,
    isLoading,
    saveServer,
    removeServer,
    setServers,
  };
};