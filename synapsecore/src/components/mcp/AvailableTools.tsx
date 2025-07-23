import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Search, Filter, Play, Code, BookOpen, Tag } from 'lucide-react';
import { MCPTool } from '@/types/mcp';

interface AvailableToolsProps {
  tools: MCPTool[];
  onToolSelect: (tool: MCPTool) => void;
}

export const AvailableTools = ({ tools, onToolSelect }: AvailableToolsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServer, setSelectedServer] = useState<string>('all');

  // Get unique categories and servers
  const categories = Array.from(new Set(tools.map(tool => tool.category).filter(Boolean))) as string[];
  const servers = Array.from(new Set(tools.map(tool => tool.serverUrl).filter(Boolean))) as string[];

  // Filter tools based on search and filters
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesServer = selectedServer === 'all' || tool.serverUrl === selectedServer;
    
    return matchesSearch && matchesCategory && matchesServer;
  });

  const getToolIcon = (tool: MCPTool) => {
    // You can customize this based on tool names or categories
    if (tool.name.toLowerCase().includes('code') || tool.name.toLowerCase().includes('git')) {
      return <Code className="h-4 w-4" />;
    }
    if (tool.name.toLowerCase().includes('doc') || tool.name.toLowerCase().includes('read')) {
      return <BookOpen className="h-4 w-4" />;
    }
    return <Wrench className="h-4 w-4" />;
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    
    const colors = {
      'automation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'development': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'communication': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'productivity': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'data': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'ai': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'utility': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    
    const key = category.toLowerCase();
    return colors[key as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (tools.length === 0) {
    return (
      <Card className="bg-gradient-surface border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Available Tools
          </CardTitle>
          <CardDescription>
            No tools available yet. Connect to MCP servers to see their tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Tools will appear here once you connect to MCP servers</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-surface border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Available Tools
          <Badge variant="outline" className="ml-auto">
            {filteredTools.length} of {tools.length} tools
          </Badge>
        </CardTitle>
        <CardDescription>
          Test and explore tools available from your connected MCP servers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      <span className="capitalize">{category}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Server
              </label>
              <Select value={selectedServer} onValueChange={setSelectedServer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Servers</SelectItem>
                  {servers.map(server => (
                    <SelectItem key={server} value={server}>
                      {new URL(server!).hostname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No tools match your search criteria</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <div
                key={`${tool.serverId}-${tool.name}`}
                className="p-4 border rounded-lg bg-card hover:shadow-soft transition-all duration-200 group"
              >
                <div className="space-y-3">
                  {/* Tool Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getToolIcon(tool)}
                      <h3 className="font-medium text-sm truncate">{tool.name}</h3>
                    </div>
                    {tool.category && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ml-2 ${getCategoryColor(tool.category)}`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tool.category}
                      </Badge>
                    )}
                  </div>

                  {/* Tool Description */}
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {tool.description}
                  </p>

                  {/* Tool Parameters */}
                  {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Parameters:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(tool.parameters).slice(0, 3).map(param => (
                          <Badge key={param} variant="secondary" className="text-xs">
                            {param}
                          </Badge>
                        ))}
                        {Object.keys(tool.parameters).length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{Object.keys(tool.parameters).length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Server Info */}
                  {tool.serverUrl && (
                    <p className="text-xs text-muted-foreground truncate">
                      From: {new URL(tool.serverUrl).hostname}
                    </p>
                  )}

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant="mcp"
                    onClick={() => onToolSelect(tool)}
                    className="w-full"
                  >
                    <Play className="h-3 w-3 mr-2" />
                    Test Tool
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};