import React, { createContext, useState, ReactNode, useEffect, FC } from 'react';
import type { KnowledgeBase, Document, ApiKey } from '../types';
import { DocumentStatus } from '../types';
import { vectorVaultService } from '../../../services/vectorVaultService';

// --- TYPES ---
interface DocumentProgress {
  [documentId: string]: { progress: number; status: string; error?: string };
}

// --- LOCALSTORAGE HELPERS ---
const getStoredItem = <T extends {}>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
};

// --- CONTEXT DEFINITION ---
interface AppContextType {
    knowledgeBases: KnowledgeBase[];
    documents: Document[];
    apiKeys: ApiKey[];
    documentProgress: DocumentProgress;
    selectedKbId: string;
    setSelectedKbId: (kbId: string) => void;
    addKnowledgeBase: (name: string, description?: string) => Promise<KnowledgeBase>;
    deleteKnowledgeBase: (knowledgeBaseId: string) => Promise<boolean>;
    addDocument: (doc: Omit<Document, 'id' | 'created_at' | 'status' | 'vector_count'>, tempId: string) => Promise<void>;
    updateDocument: (updatedDoc: Document) => void;
    deleteDocument: (documentId: string, knowledgeBaseId: string) => Promise<boolean>;
    updateDocumentStatus: (docId: string, status: DocumentStatus, error?: string) => void;
    generateApiKey: (name: string, knowledgeBaseId: string) => ApiKey | null;
    revokeApiKey: (keyId: string) => void;
    exportDataForServer: () => string;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

// --- PROVIDER COMPONENT ---
export const AppProvider: FC<{children: ReactNode}> = ({ children }) => {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(() => getStoredItem('knowledgeBases', []));
    const [documents, setDocuments] = useState<Document[]>(() => getStoredItem('documents', []));
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => getStoredItem('apiKeys', []));
    const [documentProgress, setDocumentProgress] = useState<DocumentProgress>({});
    const [selectedKbId, setSelectedKbId] = useState<string>('');

    useEffect(() => { window.localStorage.setItem('knowledgeBases', JSON.stringify(knowledgeBases)); }, [knowledgeBases]);
    useEffect(() => { window.localStorage.setItem('documents', JSON.stringify(documents)); }, [documents]);
    useEffect(() => { window.localStorage.setItem('apiKeys', JSON.stringify(apiKeys)); }, [apiKeys]);

    const updateDocumentStatus = (docId: string, status: DocumentStatus, error?: string) => {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status, error } : d));
    };

    const addKnowledgeBase = async (name: string, description: string = '') => {
        const newKb = await vectorVaultService.createKnowledgeBase(name, description);
        setKnowledgeBases(prev => [...prev, newKb]);
        return newKb;
    };

    const deleteKnowledgeBase = async (knowledgeBaseId: string): Promise<boolean> => {
        const success = await vectorVaultService.deleteKnowledgeBase(knowledgeBaseId);
        if (success) {
            setKnowledgeBases(prev => prev.filter(kb => kb.id !== knowledgeBaseId));
            setDocuments(prev => prev.filter(d => d.knowledgeBaseId !== knowledgeBaseId));
        }
        return success;
    };

    const addDocument = async (doc: Omit<Document, 'id' | 'created_at' | 'status' | 'vector_count'>, tempId: string): Promise<void> => {
        const pendingDoc: Document = {
            ...doc,
            id: tempId,
            created_at: new Date().toISOString(),
            status: DocumentStatus.Pending,
            vector_count: 0,
        };
        setDocuments(prev => [pendingDoc, ...prev]);
        setDocumentProgress(prev => ({ ...prev, [tempId]: { progress: 0, status: 'processing' } }));

        try {
            const newDoc = await vectorVaultService.createDocument(
                doc,
                doc.knowledgeBaseId,
                (progress) => setDocumentProgress(prev => ({ ...prev, [tempId]: { progress, status: 'processing' } })),
                (vectorProgress) => setDocumentProgress(prev => ({ ...prev, [tempId]: { progress: vectorProgress, status: 'progress' } }))
            );

            setDocuments(prev => prev.map(d => d.id === tempId ? newDoc : d));
            setKnowledgeBases(prev => prev.map(kb => 
                kb.id === newDoc.knowledgeBaseId ? { ...kb, documentCount: (kb.documentCount || 0) + 1 } : kb
            ));
            setDocumentProgress(prev => ({ ...prev, [tempId]: { progress: 100, status: 'complete' } }));

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            updateDocumentStatus(tempId, DocumentStatus.Failed, errorMessage);
            setDocumentProgress(prev => ({ ...prev, [tempId]: { progress: 0, status: 'error', error: errorMessage } }));
        }
    };

    const updateDocument = (updatedDoc: Document) => {
        setDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
    };

    const deleteDocument = async (documentId: string, knowledgeBaseId: string): Promise<boolean> => {
        const success = await vectorVaultService.deleteDocument(documentId);
        if (success) {
            setDocuments(prev => prev.filter(d => d.id !== documentId));
            setKnowledgeBases(prev => prev.map(kb => 
                kb.id === knowledgeBaseId ? { ...kb, documentCount: Math.max(0, (kb.documentCount || 1) - 1) } : kb
            ));
        }
        return success;
    };
    
    const generateApiKey = (name: string, knowledgeBaseId: string): ApiKey | null => {
        const kb = knowledgeBases.find(k => k.id === knowledgeBaseId);
        if (!kb) {
            console.error("Cannot generate API key: Knowledge base not found.");
            return null;
        }

        const rawKey = `vv_sk_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;
        const newKey: ApiKey = {
            id: `key_${Date.now()}`,
            name: name.trim(),
            key: rawKey,
            displayKey: `${rawKey.slice(0, 9)}...${rawKey.slice(-4)}`,
            createdAt: new Date().toLocaleDateString(),
            lastUsed: 'Never',
            knowledgeBaseId: kb.id,
            knowledgeBaseName: kb.name,
        };
        setApiKeys(prev => [...prev, newKey]);
        return newKey;
    };

    const revokeApiKey = (keyId: string) => {
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
    };

    const exportDataForServer = (): string => {
        const data = {
            knowledgeBases,
            documents,
            apiKeys
        };
        return JSON.stringify(data, null, 2);
    };

    const value: AppContextType = {
        knowledgeBases,
        documents,
        apiKeys,
        documentProgress,
        selectedKbId,
        setSelectedKbId,
        addKnowledgeBase,
        deleteKnowledgeBase,
        addDocument,
        updateDocument,
        deleteDocument,
        updateDocumentStatus,
        generateApiKey,
        revokeApiKey,
        exportDataForServer,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};