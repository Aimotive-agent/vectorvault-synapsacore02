export enum View {
  Dashboard = 'dashboard',
  Documents = 'documents',
  Server = 'server',
  Settings = 'settings',
  Chat = 'chat'
}

export enum DocumentStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  name: string;
  type?: 'PDF' | 'DOCX' | 'TXT' | 'MD' | 'CSV' | 'XLSX';
  size?: string;
  status: DocumentStatus;
  created_at: string;
  tags?: string[];
  content: string;
  metadata?: Record<string, any>;
  error?: string;
  vector_count: number;
  vectorData?: Array<{ chunk: string; embedding: number[] }>;
  file?: File;
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
