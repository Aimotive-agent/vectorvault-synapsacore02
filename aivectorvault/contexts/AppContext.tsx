
import React, { createContext, useState, ReactNode, useEffect, FC } from 'react';
import type { KnowledgeBase, Document, ApiKey } from '../types';
import { DocumentStatus } from '../types';

// --- LOCALSTORAGE HELPERS ---
const getStoredItem = <T extends {}>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// --- CONTEXT DEFINITION ---
interface AppContextType {
    knowledgeBases: KnowledgeBase[];
    documents: Document[];
    apiKeys: ApiKey[];
    addKnowledgeBase: (name: string) => KnowledgeBase;
    addDocument: (doc: Omit<Document, 'id' | 'status' | 'uploadDate'>) => Document;
    updateDocumentStatus: (docId: string, status: DocumentStatus) => void;
    generateApiKey: (name: string, knowledgeBaseId: string) => ApiKey | null;
    revokeApiKey: (keyId: string) => void;
    exportDataForServer: () => string;
}

// Provide a default value for the context to prevent runtime errors if used without a Provider.
export const AppContext = createContext<AppContextType>({
    knowledgeBases: [],
    documents: [],
    apiKeys: [],
    addKnowledgeBase: () => { throw new Error('Cannot call addKnowledgeBase outside of AppProvider'); },
    addDocument: () => { throw new Error('Cannot call addDocument outside of AppProvider'); },
    updateDocumentStatus: () => { throw new Error('Cannot call updateDocumentStatus outside of AppProvider'); },
    generateApiKey: () => { throw new Error('Cannot call generateApiKey outside of AppProvider'); },
    revokeApiKey: () => { throw new Error('Cannot call revokeApiKey outside of AppProvider'); },
    exportDataForServer: () => { throw new Error('Cannot call exportDataForServer outside of AppProvider'); },
});

// --- PROVIDER COMPONENT ---
export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(() => getStoredItem<KnowledgeBase[]>('vectorvault_kbs', []));
    const [documents, setDocuments] = useState<Document[]>(() => getStoredItem<Document[]>('vectorvault_docs', []));
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => getStoredItem<ApiKey[]>('vectorvault_keys', []));

    useEffect(() => {
        window.localStorage.setItem('vectorvault_kbs', JSON.stringify(knowledgeBases));
    }, [knowledgeBases]);

    useEffect(() => {
        window.localStorage.setItem('vectorvault_docs', JSON.stringify(documents));
    }, [documents]);
    
    useEffect(() => {
        window.localStorage.setItem('vectorvault_keys', JSON.stringify(apiKeys));
    }, [apiKeys]);


    const addKnowledgeBase = (name: string): KnowledgeBase => {
        const newKb: KnowledgeBase = {
            id: `kb_${Date.now()}`,
            name: name.trim(),
            documentCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
        };
        setKnowledgeBases(prev => [...prev, newKb]);
        return newKb;
    };

    const addDocument = (doc: Omit<Document, 'id' | 'status' | 'uploadDate'>): Document => {
        const newDoc: Document = {
            ...doc,
            id: `doc_${Date.now()}`,
            status: DocumentStatus.Processing,
            uploadDate: new Date().toISOString().split('T')[0],
        };
        setDocuments(prev => [...prev, newDoc]);
        setKnowledgeBases(prev => prev.map(kb => 
            kb.id === doc.knowledgeBaseId ? { ...kb, documentCount: kb.documentCount + 1 } : kb
        ));
        return newDoc;
    };

    const updateDocumentStatus = (docId: string, status: DocumentStatus) => {
        setDocuments(prev => prev.map(doc => (doc.id === docId ? { ...doc, status } : doc)));
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
        addKnowledgeBase,
        addDocument,
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
