import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Server, RefreshCw, Trash2, Globe, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { MCPServer } from '@/types/mcp';
import { formatDistanceToNow } from 'date-fns';

interface ConnectedServersProps {
  servers: MCPServer[];
  onRefreshServer: (serverId: string) => void;
  onRemoveServer: (serverId: string) => void;
  isRefreshing?: string;
}

export const ConnectedServers = ({ 
  servers, 
  onRefreshServer, 
  onRemoveServer, 
  isRefreshing 
}: ConnectedServersProps) => {
  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: MCPServer['status']) => {
    const variants = {
      connected: 'bg-success/10 text-success border-success/20',
      connecting: 'bg-warning/10 text-warning border-warning/20',
      error: 'bg-destructive/10 text-destructive border-destructive/20',
      disconnected: 'bg-muted text-muted-foreground'
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  if (servers.length === 0) {
    return (
      <Card className="bg-gradient-surface border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Connected Servers
          </CardTitle>
          <CardDescription>
            No MCP servers connected yet. Add a server above to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Connect to MCP servers to access their tools</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-surface border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Connected Servers
          <Badge variant="outline" className="ml-auto">
            {servers.length} server{servers.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage your connected MCP servers and their available tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {servers.map((server, index) => (
            <div key={server.id}>
              <div className="flex items-start justify-between p-4 border rounded-lg bg-card hover:shadow-soft transition-all duration-200">
                <div className="flex-1 space-y-3">
                  {/* Server Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{server.name}</h3>
                        {getStatusBadge(server.status)}
                      </div>
                      <p className="text-xs text-muted-foreground break-all">
                        {server.url}
                      </p>
                      {server.description && (
                        <p className="text-xs text-muted-foreground">
                          {server.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Server Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">{server.tools.length}</span>
                      tools available
                    </div>
                    {server.lastConnected && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Connected {formatDistanceToNow(server.lastConnected, { addSuffix: true })}
                      </div>
                    )}
                  </div>

                  {/* Tools Preview */}
                  {server.tools.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Available Tools:</p>
                      <div className="flex flex-wrap gap-1">
                        {server.tools.slice(0, 6).map((tool) => (
                          <Badge 
                            key={tool.name} 
                            variant="secondary" 
                            className="text-xs"
                          >
                            {tool.name}
                          </Badge>
                        ))}
                        {server.tools.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{server.tools.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRefreshServer(server.id)}
                    disabled={isRefreshing === server.id || server.status === 'connecting'}
                    className="flex items-center gap-1"
                  >
                    {isRefreshing === server.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveServer(server.id)}
                    disabled={isRefreshing === server.id}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                </div>
              </div>
              
              {index < servers.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};