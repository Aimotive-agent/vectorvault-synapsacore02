export type View = 'dashboard' | 'documents' | 'server' | 'settings' | 'chat';

export enum DocumentStatus {
  Processing = 'Processing',
  Indexed = 'Indexed',
  Error = 'Error',
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'TXT' | 'MD' | 'CSV' | 'XLSX';
  size: string;
  status: DocumentStatus;
  uploadDate: string;
  tags: string[];
  content?: string;
}

export interface KnowledgeBase {
  id:string;
  name: string;
  documentCount: number;
  createdAt: string;
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