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
      console.log(`[Service] Starting vectorization for document: ${document.name}`);
      onUpdate({ status: 'processing', documentId: document.id, progress: 0 });

      // Import the functions we need
      import('./vectorRetrievalService').then(({ chunkText, createEmbedding }) => {
        try {
          if (!document.content) {
            throw new Error('Document content is empty.');
          }

          const chunks = chunkText(document.content);
          console.log(`[Service] Split document into ${chunks.length} chunks`);

          const chunkEmbeddings = chunks.map((chunk, index) => {
            const embedding = createEmbedding(chunk);
            // Post progress for every 10 chunks or the last chunk
            if ((index + 1) % 10 === 0 || index === chunks.length - 1) {
              onUpdate({ 
                status: 'progress', 
                documentId: document.id, 
                progress: Math.round(((index + 1) / chunks.length) * 100)
              });
            }
            return {
              id: `${document.id}-chunk-${index}`,
              text: chunk,
              embedding,
            };
          });

          const titleAndFirstChunk = `${document.title || document.name || ''} ${chunks[0] || ''}`;
          const docEmbedding = createEmbedding(titleAndFirstChunk);

          const vectorData = {
            chunks: chunkEmbeddings,
            embedding: docEmbedding,
          };

          // Update the document with vector data
          const updatedDoc = { ...document, vectorData };
          const storedDocs = localStorage.getItem('vectorvault_documents');
          const docs = storedDocs ? JSON.parse(storedDocs) : [];
          const updatedDocs = docs.map((d: Document) => d.id === document.id ? updatedDoc : d);
          localStorage.setItem('vectorvault_documents', JSON.stringify(updatedDocs));

          console.log(`[Service] Vectorization complete for document: ${document.name}`);
          onUpdate({ status: 'complete', documentId: document.id, vectorData });

        } catch (error) {
          console.error(`[Service] Error processing document ${document.id}:`, error);
          onUpdate({ status: 'error', documentId: document.id, error: (error as Error).message });
        }
      }).catch(error => {
        console.error(`[Service] Error importing vectorization functions:`, error);
        onUpdate({ status: 'error', documentId: document.id, error: 'Failed to load vectorization functions' });
      });

    } catch (error) {
      console.error(`Error starting vectorization for document ${document.id}:`, error);
      onUpdate({ status: 'error', documentId: document.id, error: (error as Error).message });
    }
  },
};

export default vectorVaultService;
