import React from 'react';
import { AIChat } from './AIChat';
import { AppProvider } from '../vectorvault/contexts/AppContext';
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

/**
 * Wrapper component that provides the AppContext to the AIChat component
 * This ensures that the AIChat component has access to the VectorVault state
 */
const AIChatWithVectorVault: React.FC<AIChatWithVectorVaultProps> = (props) => {
  return (
    <AppProvider>
      <AIChat {...props} />
    </AppProvider>
  );
};

export default AIChatWithVectorVault;
