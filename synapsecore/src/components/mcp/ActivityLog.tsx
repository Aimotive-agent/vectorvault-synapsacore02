import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Activity, Download, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { LogEntry } from '@/types/mcp';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLogProps {
  logs: LogEntry[];
  onClearLog: () => void;
  onExportLog: () => void;
}

export const ActivityLog = ({ logs, onClearLog, onExportLog }: ActivityLogProps) => {
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getLogBadge = (type: LogEntry['type']) => {
    const variants = {
      info: 'bg-primary/10 text-primary border-primary/20',
      success: 'bg-success/10 text-success border-success/20',
      warning: 'bg-warning/10 text-warning border-warning/20',
      error: 'bg-destructive/10 text-destructive border-destructive/20'
    };

    return (
      <Badge variant="outline" className={`${variants[type]} text-xs`}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = log.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, LogEntry[]>);

  const logCounts = logs.reduce((counts, log) => {
    counts[log.type] = (counts[log.type] || 0) + 1;
    return counts;
  }, {} as Record<LogEntry['type'], number>);

  return (
    <Card className="bg-gradient-surface border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Log
          <div className="ml-auto flex gap-2">
            {Object.entries(logCounts).map(([type, count]) => (
              <Badge 
                key={type} 
                variant="outline" 
                className="text-xs"
              >
                {count} {type}
              </Badge>
            ))}
          </div>
        </CardTitle>
        <CardDescription>
          System activity, connections, and tool execution logs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Log Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onExportLog}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Log
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClearLog}
            disabled={logs.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Log
          </Button>
        </div>

        {/* Log Entries */}
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity logged yet</p>
            <p className="text-sm">System events and tool executions will appear here</p>
          </div>
        ) : (
          <div className="h-80 border rounded-lg bg-muted/30">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {Object.entries(groupedLogs)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([date, dateLogs]) => (
                    <div key={date} className="space-y-2">
                      <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-1">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <Separator className="mt-1" />
                      </div>
                      
                      <div className="space-y-2">
                        {dateLogs
                          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                          .map((log) => (
                            <div
                              key={log.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-card border hover:shadow-soft transition-all duration-200"
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {getLogIcon(log.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm break-words flex-1">
                                    <span className="mr-2">{log.icon}</span>
                                    {log.message}
                                  </p>
                                  {getLogBadge(log.type)}
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>
                                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {log.timestamp.toLocaleTimeString()}
                                  </span>
                                  {log.source && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{log.source}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Log Statistics */}
        {logs.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-foreground">{logs.length}</div>
                <div className="text-muted-foreground">Total Entries</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-success">{logCounts.success || 0}</div>
                <div className="text-muted-foreground">Success</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-warning">{logCounts.warning || 0}</div>
                <div className="text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-destructive">{logCounts.error || 0}</div>
                <div className="text-muted-foreground">Errors</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};