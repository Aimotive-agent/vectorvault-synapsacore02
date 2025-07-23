-- Create MCP servers table for persistence
CREATE TABLE public.mcp_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  tools JSONB DEFAULT '[]'::jsonb,
  last_connected TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own MCP servers" 
ON public.mcp_servers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own MCP servers" 
ON public.mcp_servers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MCP servers" 
ON public.mcp_servers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MCP servers" 
ON public.mcp_servers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mcp_servers_updated_at
BEFORE UPDATE ON public.mcp_servers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();