import React from 'react';
import { AIChat } from './AIChat';

import { AISettings, MCPServer, MCPTool, OpenAIModel, OpenRouterModel } from '@/types/mcp';

interface AIChatWithVectorVaultProps {
  servers: MCPServer[];
  tools: MCPTool[];
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  availableModels: OpenAIModel[];
  openrouterModels: OpenRouterModel[];
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error', icon: string) => void;
}

const AIChatWithVectorVault: React.FC<AIChatWithVectorVaultProps> = (props) => {
  return <AIChat {...props} />;
};

export default AIChatWithVectorVault;
