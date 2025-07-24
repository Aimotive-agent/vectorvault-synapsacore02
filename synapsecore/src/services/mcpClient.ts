// MCP Client using official SDK - based on Genspark's working implementation
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  category?: string;
}

export interface MCPConnectionResult {
  success: boolean;
  tools: MCPTool[];
  message?: string;
  error?: string;
}

export class MCPClientManager {
  private clients = new Map<string, Client>();
  private tools = new Map<string, MCPTool & { serverName: string; client: Client }>();

  async connectToMCP(url: string, name: string): Promise<MCPConnectionResult> {
    try {
      console.log(`🔌 Connecting to MCP server: ${name} at ${url}`);
      
      let transport;
      let client;

      // Determine transport type based on URL (following Genspark's pattern)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log(`🌐 Using SSE transport for HTTP/HTTPS URL`);
        // HTTP/SSE transport for Pipedream-style connections
        transport = new SSEClientTransport(new URL(url));
      } else {
        throw new Error('Only HTTP/HTTPS URLs are supported currently');
      }

      // Create MCP client with proper capabilities (matching Genspark)
      client = new Client({
        name: "vectorvault-client",
        version: "1.0.0",
      }, {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {}
        }
      });

      console.log(`🔗 Connecting MCP client to transport...`);
      await client.connect(transport);
      
      console.log(`✅ MCP client connected successfully!`);
      
      // Store the client
      this.clients.set(name, client);

      // Get available tools using the official SDK method
      console.log(`🔍 Listing tools from MCP server...`);
      const toolsResult = await client.listTools();
      const serverTools = toolsResult.tools || [];

      console.log(`🎉 Found ${serverTools.length} tools from MCP server!`);

      // Store tools with server reference
      const mappedTools: MCPTool[] = serverTools.map(tool => {
        const mappedTool: MCPTool = {
          name: tool.name || 'Unknown Tool',
          description: tool.description || 'No description available',
          inputSchema: tool.inputSchema || {},
          category: 'MCP Tool'
        };

        // Store in internal map for execution
        this.tools.set(tool.name, {
          ...mappedTool,
          serverName: name,
          client: client
        });

        return mappedTool;
      });

      return {
        success: true,
        tools: mappedTools,
        message: `Connected to ${name} successfully and found ${mappedTools.length} tools`
      };

    } catch (error: any) {
      console.error(`❌ Failed to connect to MCP server ${name}:`, error);
      return {
        success: false,
        tools: [],
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async executeTool(toolName: string, parameters: any) {
    const toolInfo = this.tools.get(toolName);
    if (!toolInfo) {
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      console.log(`🔧 Executing tool: ${toolName} with parameters:`, parameters);
      const result = await toolInfo.client.callTool({
        name: toolName,
        arguments: parameters
      });

      console.log(`✅ Tool execution completed:`, result);
      return result;
    } catch (error: any) {
      console.error(`❌ Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  getAvailableTools(): MCPTool[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      category: tool.category || 'MCP Tool'
    }));
  }

  async disconnectAll() {
    console.log(`🔌 Disconnecting all MCP clients...`);
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
        console.log(`✅ Disconnected from ${name}`);
      } catch (error) {
        console.error(`❌ Error closing connection to ${name}:`, error);
      }
    }
    this.clients.clear();
    this.tools.clear();
  }

  async disconnectServer(name: string) {
    const client = this.clients.get(name);
    if (client) {
      try {
        await client.close();
        this.clients.delete(name);
        
        // Remove tools from this server
        for (const [toolName, toolInfo] of this.tools.entries()) {
          if (toolInfo.serverName === name) {
            this.tools.delete(toolName);
          }
        }
        
        console.log(`✅ Disconnected from ${name}`);
      } catch (error) {
        console.error(`❌ Error disconnecting from ${name}:`, error);
      }
    }
  }
}

// Export singleton instance
export const mcpClient = new MCPClientManager();
