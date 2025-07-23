import { KnowledgeBase, Document, DocumentStatus } from '../components/vectorvault/types';

/**
 * Service for interacting with the Vector Vault data, using localStorage as a mock backend.
 */
export const vectorVaultService = {
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const storedKbs = localStorage.getItem('vectorvault_knowledge_bases');
    return storedKbs ? JSON.parse(storedKbs) : [];
  },

  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    const kbs = await this.getKnowledgeBases();
    return kbs.find(kb => kb.id === id) || null;
  },

  async setActiveKnowledgeBase(id: string): Promise<{ success: boolean }> {
    localStorage.setItem('vectorvault_active_kb', id);
    return { success: true };
  },

  async getActiveKnowledgeBaseId(): Promise<string | null> {
    return localStorage.getItem('vectorvault_active_kb');
  },

  async addDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'status'>, kbId: string): Promise<Document> {
    const newDoc: Document = {
      ...document,
      id: `doc_${Date.now()}`,
      knowledgeBaseId: kbId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: DocumentStatus.Processing,
    };

    const docs = await this.getDocuments();
    docs.push(newDoc);
    localStorage.setItem('vectorvault_documents', JSON.stringify(docs));

    const kbs = await this.getKnowledgeBases();
    const kbIndex = kbs.findIndex(kb => kb.id === kbId);
    if (kbIndex !== -1) {
      kbs[kbIndex].documentCount = (kbs[kbIndex].documentCount || 0) + 1;
      localStorage.setItem('vectorvault_knowledge_bases', JSON.stringify(kbs));
    }

    return newDoc;
  },

  async getDocuments(): Promise<Document[]> {
    const storedDocs = localStorage.getItem('vectorvault_documents');
    return storedDocs ? JSON.parse(storedDocs) : [];
  },

  async createKnowledgeBase(name: string, description: string): Promise<KnowledgeBase> {
    const newKb: KnowledgeBase = {
      id: `kb_${Date.now()}`,
      name,
      description,
      documentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatar: `https://i.pravatar.cc/150?u=${name}`,
    };

    const kbs = await this.getKnowledgeBases();
    kbs.push(newKb);
    localStorage.setItem('vectorvault_knowledge_bases', JSON.stringify(kbs));

    return newKb;
  },

  async deleteKnowledgeBase(kbId: string): Promise<boolean> {
    let kbs = await this.getKnowledgeBases();
    kbs = kbs.filter(kb => kb.id !== kbId);
    localStorage.setItem('vectorvault_knowledge_bases', JSON.stringify(kbs));

    let docs = await this.getDocuments();
    docs = docs.filter(doc => doc.knowledgeBaseId !== kbId);
    localStorage.setItem('vectorvault_documents', JSON.stringify(docs));

    return true;
  },

  async deleteDocument(documentId: string): Promise<boolean> {
    const docs = await this.getDocuments();
    const docToDelete = docs.find(doc => doc.id === documentId);
    if (!docToDelete) return false;

    const updatedDocs = docs.filter(doc => doc.id !== documentId);
    localStorage.setItem('vectorvault_documents', JSON.stringify(updatedDocs));

    const kbs = await this.getKnowledgeBases();
    const kbIndex = kbs.findIndex(kb => kb.id === docToDelete.knowledgeBaseId);
    if (kbIndex !== -1) {
      kbs[kbIndex].documentCount = Math.max(0, kbs[kbIndex].documentCount - 1);
      localStorage.setItem('vectorvault_knowledge_bases', JSON.stringify(kbs));
    }

    return true;
  },

  processDocumentForVectorization(document: Document, onUpdate: (update: any) => void): void {
    try {
      console.log(`[Service] Kicking off vectorization for document: ${document.name}`);
      
      const worker = new Worker(new URL('../workers/vectorizer.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (event: MessageEvent) => {
        onUpdate(event.data);
        if (event.data.status === 'complete' || event.data.status === 'error') {
          worker.terminate();
        }
      };

      worker.onerror = (error: ErrorEvent) => {
        console.error('Error in vectorizer worker:', error);
        onUpdate({ status: 'error', documentId: document.id, error: error.message });
        worker.terminate();
      };

      worker.postMessage({ document });

    } catch (error) {
      console.error(`Error kicking off vectorization for document ${document.id}:`, error);
      onUpdate({ status: 'error', documentId: document.id, error: (error as Error).message });
    }
  }
};

export default vectorVaultService;
