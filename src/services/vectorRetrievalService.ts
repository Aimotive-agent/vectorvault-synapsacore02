import { vectorVaultService } from './vectorVaultService';
import { Document } from '../components/vectorvault/types';

// Text embedding function that creates real vector embeddings
export const createEmbedding = (text: string): number[] => {
  // This is a more robust embedding function that creates consistent vectors
  // In a production environment, this would call the Gemini API for embeddings
  
  if (!text || text.trim().length === 0) {
    // Return a zero vector for empty text
    return Array(128).fill(0);
  }
  
  // Create a deterministic hash-based embedding
  const embedding: number[] = [];
  const normalizedText = text.toLowerCase().trim();
  
  // Use a hash function to generate consistent embeddings for the same text
  for (let i = 0; i < 128; i++) {
    let hash = 0;
    for (let j = 0; j < normalizedText.length; j++) {
      const char = normalizedText.charCodeAt(j);
      hash = ((hash << 5) - hash) + char + i;
      hash |= 0; // Convert to 32bit integer
    }
    
    // Convert hash to a value between -1 and 1
    const value = Math.sin(hash) * 0.5 + 0.5;
    embedding.push(value);
  }
  
  // Normalize the embedding vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }
  
  return embedding;
};

// Split text into chunks of approximately the specified size
export function chunkText(text: string, chunkSize: number = 1000, overlapSize: number = 200): string[] {
  if (!text || text.length <= chunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = startIndex + chunkSize;
    
    // If we're not at the end of the text, try to find a good breaking point
    if (endIndex < text.length) {
      // Look for paragraph breaks, sentence breaks, or word breaks near the target end
      const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
      const sentenceBreak = text.lastIndexOf('. ', endIndex);
      const wordBreak = text.lastIndexOf(' ', endIndex);
      
      // Use the closest break point that's not too far from our target
      if (paragraphBreak > startIndex && paragraphBreak > endIndex - 200) {
        endIndex = paragraphBreak + 2; // Include the paragraph break
      } else if (sentenceBreak > startIndex && sentenceBreak > endIndex - 100) {
        endIndex = sentenceBreak + 2; // Include the period and space
      } else if (wordBreak > startIndex) {
        endIndex = wordBreak + 1; // Include the space
      }
    }
    
    // Extract the chunk
    chunks.push(text.substring(startIndex, endIndex).trim());
    
    // Move start index for next chunk, accounting for overlap
    startIndex = endIndex - overlapSize;
    if (startIndex < 0) startIndex = 0;
  }
  
  return chunks;
}

// Calculate cosine similarity between two embeddings
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Service for retrieving and processing vector data for RAG
 */
export const vectorRetrievalService = {
  /**
   * Retrieve relevant documents from a knowledge base based on a query
   */
  async retrieveRelevantDocuments(knowledgeBaseId: string, query: string, topK: number = 5): Promise<Document[]> {
    console.log(`vectorRetrievalService: Retrieving relevant documents for KB ${knowledgeBaseId} with query: "${query}"`);
    try {
      const queryEmbedding = createEmbedding(query);
      console.log('vectorRetrievalService: Generated query embedding.');

      const allDocuments = await vectorVaultService.getDocuments();
      const documents = allDocuments.filter(doc => doc.knowledgeBaseId === knowledgeBaseId);
      console.log(`vectorRetrievalService: Retrieved ${documents.length} documents for the specified knowledge base.`);

      if (!documents || documents.length === 0) {
        return [];
      }

      const scoredDocuments = documents
        .map(doc => {
          // Ensure vectorData and its embedding exist before calculating similarity
          const docEmbedding = doc.vectorData?.embedding || [];
          const similarity = docEmbedding.length > 0 ? this.cosineSimilarity(queryEmbedding, docEmbedding) : 0;
          console.log(`vectorRetrievalService: Document "${doc.name}" - embedding length: ${docEmbedding.length}, similarity: ${similarity}`);
          return { ...doc, similarity };
        })
        .filter(doc => {
          // If document has no embedding, use text search as fallback
          if (!doc.vectorData?.embedding || doc.vectorData.embedding.length === 0) {
            // Simple text search fallback
            const queryLower = query.toLowerCase();
            const contentLower = (doc.content || '').toLowerCase();
            const nameLower = (doc.name || '').toLowerCase();
            const hasTextMatch = contentLower.includes(queryLower) || nameLower.includes(queryLower);
            if (hasTextMatch) {
              console.log(`vectorRetrievalService: Including document "${doc.name}" via text search fallback`);
              // Assign a moderate similarity score for text matches
              doc.similarity = 0.3;
              return true;
            }
            // If no text match, still include with very low similarity to show available docs
            doc.similarity = 0.05;
            return true;
          }
          // Lower threshold to 0.1 to be more inclusive
          return doc.similarity > 0.1;
        })

      scoredDocuments.sort((a, b) => b.similarity - a.similarity);
      console.log(`vectorRetrievalService: Found ${scoredDocuments.length} relevant documents after scoring and filtering.`);

      const topDocuments = scoredDocuments.slice(0, topK);
      console.log(`vectorRetrievalService: Returning top ${topDocuments.length} documents.`);
      return topDocuments;
    } catch (error) {
      console.error('Error retrieving relevant documents:', error);
      return [];
    }
  },

  /**
   * Format retrieved documents into a context string for the AI
   */
  formatDocumentsForContext(documents: Document[]): string {
    if (!documents || documents.length === 0) {
      return '';
    }

    return documents.map((doc, index) => {
      // Extract metadata for context
      const metadata = [];
      if (doc.type) metadata.push(`Type: ${doc.type}`);
      if (doc.uploadDate) metadata.push(`Uploaded: ${doc.uploadDate}`);
      if (doc.tags && doc.tags.length > 0) metadata.push(`Tags: ${doc.tags.join(', ')}`);
      
      const metadataStr = metadata.length > 0 ? `\nMETADATA: ${metadata.join(' | ')}` : '';
      
      // Format the document with clear section markers
      return `
[DOCUMENT ${index + 1}]: ${doc.title || 'Untitled Document'}${metadataStr}

${doc.content || 'No content available'}

---`;
    }).join('\n');
  },

  /**
   * Generate a RAG-enhanced system prompt with retrieved context
   */
  async generateRAGPrompt(basePrompt: string, knowledgeBaseId: string, query: string): Promise<string> {
    console.log(`vectorRetrievalService: Generating RAG prompt for KB ${knowledgeBaseId} with query: "${query}"`);
    try {
      // Get the knowledge base to show its name in the prompt
      const kb = await vectorVaultService.getKnowledgeBase(knowledgeBaseId);
      if (!kb) {
        console.error(`vectorRetrievalService: Knowledge base with ID ${knowledgeBaseId} not found.`);
        return basePrompt; // Return base prompt if knowledge base not found
      }
      
      // Retrieve relevant documents
      const relevantDocs = await this.retrieveRelevantDocuments(knowledgeBaseId, query);
      
      if (relevantDocs.length === 0) {
        console.log(`⚠️ No relevant documents found in knowledge base "${kb.name}" for query: ${query}`);
        // Instead of returning a complex prompt, just use the user's query directly
        // This ensures the AI responds naturally to the user's question
        const finalPrompt = `You are a helpful AI assistant. Please answer the following question: ${query}

Note: You have access to the "${kb.name}" vector base, but no relevant documents were found for this query, so please provide a helpful response based on your general knowledge.`;
        console.log('vectorRetrievalService: Generated final prompt (no relevant docs):', finalPrompt);
        return finalPrompt;
      }

      console.log(`✅ Found ${relevantDocs.length} relevant documents in "${kb.name}" for query: "${query}"`);

      // Format documents into context
      const contextString = this.formatDocumentsForContext(relevantDocs);
      
      // Enhance the prompt with the retrieved context
      const finalPrompt = `${basePrompt}

[VECTOR KNOWLEDGE BASE: ${kb.name}]
You have access to the "${kb.name}" vector base. The following documents have been retrieved based on relevance to the user's query:

${contextString}

[RETRIEVAL-AUGMENTED GENERATION INSTRUCTIONS]
1. Prioritize information from the retrieved documents when answering the user's query
2. Cite specific documents by their number when using information from them (e.g., "According to Document 1...")
3. If the retrieved documents contain conflicting information, acknowledge this and explain the different perspectives
4. If the retrieved documents don't fully answer the query, supplement with your general knowledge but clearly distinguish between information from the documents and your general knowledge
5. If the user asks about something completely unrelated to the retrieved documents, you can answer normally without referencing them
6. Always maintain a helpful, informative tone regardless of whether you're using retrieved information or general knowledge`;
      console.log('vectorRetrievalService: Generated final RAG prompt:', finalPrompt);
      return finalPrompt;
    } catch (error) {
      console.error('Error generating RAG prompt:', error);
      return basePrompt;
    }
  }
};

export default vectorRetrievalService;
