// This is the entry point for our new web worker.
// It will handle the heavy lifting of text chunking and vectorization.

import { chunkText, createEmbedding } from '../services/vectorRetrievalService';

self.onmessage = (event: MessageEvent<{ document: { id: string, content: string, name: string, title: string } }>) => {
  const { document } = event.data;
  const { id, content, name, title } = document;

  try {
    console.log(`[Worker] Starting vectorization for document: ${name}`);
    self.postMessage({ status: 'processing', documentId: id });

    if (!content) {
      throw new Error('Document content is empty.');
    }

    const chunks = chunkText(content);
    console.log(`[Worker] Split document into ${chunks.length} chunks`);

    const chunkEmbeddings = chunks.map((chunk, index) => {
      const embedding = createEmbedding(chunk);
      // Post progress for each chunk
      if ((index + 1) % 10 === 0 || index === chunks.length - 1) {
        self.postMessage({ 
          status: 'progress', 
          documentId: id, 
          progress: Math.round(((index + 1) / chunks.length) * 100)
        });
      }
      return {
        id: `${id}-chunk-${index}`,
        text: chunk,
        embedding,
      };
    });

    const titleAndFirstChunk = `${title || name || ''} ${chunks[0] || ''}`;
    const docEmbedding = createEmbedding(titleAndFirstChunk);

    const vectorData = {
      chunks: chunkEmbeddings,
      embedding: docEmbedding,
    };

    console.log(`[Worker] Vectorization complete for document: ${name}`);
    self.postMessage({ status: 'complete', documentId: id, vectorData });

  } catch (error) {
    console.error(`[Worker] Error processing document ${id}:`, error);
    self.postMessage({ status: 'error', documentId: id, error: (error as Error).message });
  }
};

export {};
