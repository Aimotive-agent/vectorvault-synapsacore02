import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Server, Globe, Loader2, Zap } from 'lucide-react';
import { PresetMCPServer } from '@/types/mcp';

interface MCPServerFormProps {
  onAddServer: (name: string, url: string, description?: string) => void;
  isLoading: boolean;
}

const PRESET_SERVERS: PresetMCPServer[] = [
  {
    name: "Pipedream Workflow (Example)",
    url: "https://your-unique-id.m.pipedream.net",
    description: "Replace with YOUR actual Pipedream workflow URL. Find it in your Pipedream dashboard → Your Workflow → Copy URL",
    category: "Automation",
    features: ["Workflow automation", "API integrations", "Data processing", "Event handling"],
    documentation: "https://pipedream.com/docs"
  },
  {
    name: "GitHub API Tools",
    url: "https://api.github.com/tools",
    description: "Repository management, issue tracking, and code analysis tools",
    category: "Development",
    features: ["Repository operations", "Issue management", "Pull requests", "Code analysis"],
    documentation: "https://docs.github.com/en/rest"
  },
  {
    name: "Slack Integration",
    url: "https://slack.com/api/tools",
    description: "Send messages, manage channels, and interact with Slack workspaces",
    category: "Communication",
    features: ["Message sending", "Channel management", "User operations", "File sharing"],
    documentation: "https://api.slack.com/"
  },
  {
    name: "Google Workspace",
    url: "https://developers.google.com/workspace/tools",
    description: "Google Sheets, Docs, Drive, and Calendar integration tools",
    category: "Productivity",
    features: ["Document editing", "Spreadsheet operations", "Calendar management", "Drive operations"],
    documentation: "https://developers.google.com/workspace"
  },
  {
    name: "AWS Tools",
    url: "https://aws.amazon.com/api/tools",
    description: "AWS service management and cloud operations tools",
    category: "Cloud",
    features: ["EC2 management", "S3 operations", "Lambda functions", "Database operations"],
    documentation: "https://docs.aws.amazon.com/"
  },
  {
    name: "HubSpot CRM",
    url: "https://api.hubspot.com/tools",
    description: "Customer relationship management and marketing automation tools",
    category: "CRM",
    features: ["Contact management", "Deal tracking", "Email campaigns", "Analytics"],
    documentation: "https://developers.hubspot.com/"
  },
  {
    name: "Notion API",
    url: "https://api.notion.com/tools",
    description: "Notion database and page management tools",
    category: "Productivity",
    features: ["Database operations", "Page creation", "Content management", "Team collaboration"],
    documentation: "https://developers.notion.com/"
  },
  {
    name: "Zendesk Support",
    url: "https://developer.zendesk.com/api/tools",
    description: "Customer support and ticket management tools",
    category: "Support",
    features: ["Ticket management", "Customer interactions", "Knowledge base", "Reporting"],
    documentation: "https://developer.zendesk.com/"
  }
];

export const MCPServerForm = ({ onAddServer, isLoading }: MCPServerFormProps) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && url.trim()) {
      onAddServer(name.trim(), url.trim(), description.trim());
      setName('');
      setUrl('');
      setDescription('');
      setShowCustomForm(false);
    }
  };

  const handlePresetSelect = (preset: PresetMCPServer) => {
    onAddServer(preset.name, preset.url, preset.description);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Automation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Development': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Communication': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Productivity': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Cloud': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'CRM': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Support': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <Card className="bg-gradient-surface border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          MCP Server Configuration
        </CardTitle>
        <CardDescription>
          Add MCP servers to enable AI agents to access external tools and services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Servers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Popular MCP Servers</h3>
            <Badge variant="outline" className="text-xs">
              {PRESET_SERVERS.length} available
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_SERVERS.map((preset) => (
              <div
                key={preset.name}
                className="p-4 border rounded-lg hover:shadow-soft transition-all duration-200 bg-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">{preset.name}</h4>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getCategoryColor(preset.category)}`}
                  >
                    {preset.category}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {preset.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {preset.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {preset.features.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{preset.features.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="mcp"
                  onClick={() => handlePresetSelect(preset)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-3 w-3" />
                      Quick Connect
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Server Form */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Custom MCP Server</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomForm(!showCustomForm)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Custom
            </Button>
          </div>

          {showCustomForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serverName">Server Name</Label>
                  <Input
                    id="serverName"
                    placeholder="My MCP Server"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serverUrl">Server URL</Label>
                  <Input
                    id="serverUrl"
                    type="url"
                    placeholder="https://api.example.com/mcp"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serverDescription">Description (Optional)</Label>
                <Textarea
                  id="serverDescription"
                  placeholder="Brief description of what this server provides..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading || !name.trim() || !url.trim()}
                  variant="mcp"
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Server
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
};