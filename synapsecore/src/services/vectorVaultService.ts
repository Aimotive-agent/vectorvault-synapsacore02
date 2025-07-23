import { KnowledgeBase, Document, DocumentStatus } from '../components/vectorvault/types';
import { extractTextFromPdf } from '@/utils/pdfUtils';
import { chunkText, createEmbedding } from '@/utils/embeddingUtils';

/**
 * Service for interacting with the Vector Vault data, using localStorage as a mock backend.
 */
export const vectorVaultService = {
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const storedKbs = localStorage.getItem('knowledgeBases');
    return storedKbs ? JSON.parse(storedKbs) : [];
  },

  async getDocuments(): Promise<Document[]> {
    const storedDocs = localStorage.getItem('documents');
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
    };
    const kbs = await this.getKnowledgeBases();
    kbs.push(newKb);
    localStorage.setItem('knowledgeBases', JSON.stringify(kbs));
    return newKb;
  },

  async createDocument(
    doc: Omit<Document, 'id' | 'created_at' | 'status' | 'vector_count'>,
    kbId: string,
    onProgress: (progress: number) => void,
    onVectorProgress: (progress: number) => void
  ): Promise<Document> {
    let textContent = doc.content;

    if (doc.file) {
      onProgress(10); // Start progress
      try {
        textContent = await extractTextFromPdf(doc.file as File);
        onProgress(50); // Text extracted
      } catch (error) {
        console.error('Failed to extract text from PDF:', error);
        throw new Error('Failed to extract text from PDF.');
      }
    }

    const chunks = chunkText(textContent);
    onProgress(75); // Text chunked

    const vectorData = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);
      vectorData.push({ chunk: chunks[i], embedding });
      onVectorProgress(Math.round(((i + 1) / chunks.length) * 100));
    }

    const newDoc: Document = {
      ...doc,
      id: `doc_${Date.now()}`,
      knowledgeBaseId: kbId,
      created_at: new Date().toISOString(),
      status: DocumentStatus.Completed,
      vector_count: vectorData.length,
      vectorData,
    };

    const docs = await this.getDocuments();
    docs.push(newDoc);
    localStorage.setItem('documents', JSON.stringify(docs));

    const kbs = await this.getKnowledgeBases();
    const kbIndex = kbs.findIndex(kb => kb.id === kbId);
    if (kbIndex !== -1) {
      kbs[kbIndex].documentCount = (kbs[kbIndex].documentCount || 0) + 1;
      localStorage.setItem('knowledgeBases', JSON.stringify(kbs));
    }
    onProgress(100); // Final progress
    return newDoc;
  },

  async deleteKnowledgeBase(kbId: string): Promise<boolean> {
    let kbs = await this.getKnowledgeBases();
    kbs = kbs.filter(kb => kb.id !== kbId);
    localStorage.setItem('knowledgeBases', JSON.stringify(kbs));

    let docs = await this.getDocuments();
    docs = docs.filter(doc => doc.knowledgeBaseId !== kbId);
    localStorage.setItem('documents', JSON.stringify(docs));

    return true;
  },

  async deleteDocument(documentId: string): Promise<boolean> {
    const docs = await this.getDocuments();
    const docToDelete = docs.find(doc => doc.id === documentId);
    if (!docToDelete) return false;

    const updatedDocs = docs.filter(doc => doc.id !== documentId);
    localStorage.setItem('documents', JSON.stringify(updatedDocs));

    const kbs = await this.getKnowledgeBases();
    const kbIndex = kbs.findIndex(kb => kb.id === docToDelete.knowledgeBaseId);
    if (kbIndex !== -1) {
      kbs[kbIndex].documentCount = Math.max(0, (kbs[kbIndex].documentCount || 1) - 1);
      localStorage.setItem('knowledgeBases', JSON.stringify(kbs));
    }

    return true;
  },
};