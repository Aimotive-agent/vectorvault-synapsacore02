export enum View {
  Dashboard = 'dashboard',
  Documents = 'documents',
  Server = 'server',
  Settings = 'settings',
  Chat = 'chat'
}

export enum DocumentStatus {
  Processing = 'Processing',
  Processed = 'Processed',
  Indexed = 'Indexed',
  Error = 'Error'
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title?: string;
  name?: string;
  type?: 'PDF' | 'DOCX' | 'TXT' | 'MD' | 'CSV' | 'XLSX';
  size?: string;
  status: DocumentStatus;
  uploadDate?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
  vectorData?: {
    chunks: Array<{
      id: string;
      text: string;
      embedding: number[];
    }>;
    embedding: number[];
  };
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  displayKey: string;
  lastUsed: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}
