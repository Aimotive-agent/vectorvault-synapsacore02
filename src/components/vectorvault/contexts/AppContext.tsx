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
    addKnowledgeBase: (name: string, description?: string) => Promise<KnowledgeBase>;
    deleteKnowledgeBase: (knowledgeBaseId: string) => Promise<boolean>;
    addDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'status'>, kbId: string) => Promise<Document>;
    updateDocument: (updatedDoc: Document) => void;
    deleteDocument: (documentId: string) => Promise<boolean>;
    updateDocumentStatus: (docId: string, status: DocumentStatus, error?: string) => void;
    generateApiKey: (name: string, knowledgeBaseId: string) => ApiKey | null;
    revokeApiKey: (keyId: string) => void;
    exportDataForServer: () => string;
}

export const AppContext = createContext<AppContextType>({
    knowledgeBases: [],
    documents: [],
    apiKeys: [],
    documentProgress: {},
    addKnowledgeBase: async () => { throw new Error('Cannot call addKnowledgeBase outside of AppProvider'); },
    deleteKnowledgeBase: async () => { throw new Error('Cannot call deleteKnowledgeBase outside of AppProvider'); },
    addDocument: async () => { throw new Error('Cannot call addDocument outside of AppProvider'); return Promise.reject(new Error('Not implemented')); },
    updateDocument: () => { throw new Error('Cannot call updateDocument outside of AppProvider'); },
    deleteDocument: async () => { throw new Error('Cannot call deleteDocument outside of AppProvider'); },
    updateDocumentStatus: () => { throw new Error('Cannot call updateDocumentStatus outside of AppProvider'); },
    generateApiKey: () => { throw new Error('Cannot call generateApiKey outside of AppProvider'); },
    revokeApiKey: () => { throw new Error('Cannot call revokeApiKey outside of AppProvider'); },
    exportDataForServer: () => { throw new Error('Cannot call exportDataForServer outside of AppProvider'); },
});

// --- PROVIDER COMPONENT ---
export const AppProvider: FC<{ children: ReactNode; }> = ({ children }) => {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(() => getStoredItem('vectorvault_knowledge_bases', []));
    const [documents, setDocuments] = useState<Document[]>(() => getStoredItem('vectorvault_documents', []));
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => getStoredItem('vectorvault_api_keys', []));
    const [documentProgress, setDocumentProgress] = useState<DocumentProgress>({});

    useEffect(() => {
        localStorage.setItem('vectorvault_knowledge_bases', JSON.stringify(knowledgeBases));
    }, [knowledgeBases]);

    useEffect(() => {
        localStorage.setItem('vectorvault_documents', JSON.stringify(documents));
    }, [documents]);

    useEffect(() => {
        localStorage.setItem('vectorvault_api_keys', JSON.stringify(apiKeys));
    }, [apiKeys]);

    const addKnowledgeBase = async (name: string, description: string = ''): Promise<KnowledgeBase> => {
        const newKb = await vectorVaultService.createKnowledgeBase(name, description);
        setKnowledgeBases(prev => [...prev, newKb]);
        return newKb;
    };

    const deleteKnowledgeBase = async (knowledgeBaseId: string): Promise<boolean> => {
        const success = await vectorVaultService.deleteKnowledgeBase(knowledgeBaseId);
        if (success) {
            setKnowledgeBases(prev => prev.filter(kb => kb.id !== knowledgeBaseId));
            setDocuments(prev => prev.filter(doc => doc.knowledgeBaseId !== knowledgeBaseId));
        }
        return success;
    };

    const addDocument = async (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'status'>, kbId: string): Promise<Document> => {
        const newDoc = await vectorVaultService.addDocument(doc, kbId);
        setDocuments(prev => [...prev, newDoc]);
        setDocumentProgress(prev => ({ ...prev, [newDoc.id]: { progress: 0, status: 'starting' } }));

        vectorVaultService.processDocumentForVectorization(newDoc, (update) => {
            setDocumentProgress(prev => ({ 
                ...prev, 
                [update.documentId]: { 
                    progress: update.progress || prev[update.documentId]?.progress || 0, 
                    status: update.status,
                    error: update.error
                } 
            }));

            if (update.status === 'complete') {
                setDocuments(prevDocs => prevDocs.map(d => 
                    d.id === update.documentId ? { ...d, status: DocumentStatus.Indexed } : d
                ));
            } else if (update.status === 'error') {
                setDocuments(prevDocs => prevDocs.map(d => 
                    d.id === update.documentId ? { ...d, status: DocumentStatus.Error, error: update.error } : d
                ));
            }
        });

        return newDoc;
    };

    const updateDocument = (updatedDoc: Document) => {
        setDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
    };

    const updateDocumentStatus = (docId: string, status: DocumentStatus, error?: string) => {
        setDocuments(prev => prev.map(doc => 
            doc.id === docId ? { ...doc, status, error: error || doc.error } : doc
        ));
    };

    const deleteDocument = async (documentId: string): Promise<boolean> => {
        const success = await vectorVaultService.deleteDocument(documentId);
        if (success) {
            const docToDelete = documents.find(d => d.id === documentId);
            setDocuments(prev => prev.filter(d => d.id !== documentId));
            if (docToDelete) {
                setKnowledgeBases(prev => prev.map(kb => 
                    kb.id === docToDelete.knowledgeBaseId ? { ...kb, documentCount: Math.max(0, kb.documentCount - 1) } : kb
                ));
            }
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
