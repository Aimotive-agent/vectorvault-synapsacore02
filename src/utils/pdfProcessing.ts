/**
 * PDF Processing Utilities
 * 
 * This module provides functions for processing PDF files:
 * - Extracting text from PDFs
 * - Chunking text into manageable segments
 * - Converting text to vector embeddings
 */

import * as pdfjs from 'pdfjs-dist';

// Set worker path for PDF.js - use local worker file
// This is also set in main.tsx to ensure it's configured before any PDF processing
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

// Log that the worker is configured
console.log('PDF.js worker configured in pdfProcessing.ts:', pdfjs.GlobalWorkerOptions.workerSrc);

/**
 * Extract text content from a PDF file
 * @param file PDF file to process
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    // Extract text from each page
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    console.log(`Extracted ${fullText.length} characters from PDF with ${pdf.numPages} pages`);
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Split text into chunks of approximately the specified size
 * @param text Text to chunk
 * @param chunkSize Target size for each chunk (in characters)
 * @param overlapSize Number of characters to overlap between chunks
 * @returns Array of text chunks
 */
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
  
  console.log(`Split text into ${chunks.length} chunks`);
  return chunks;
}

/**
 * Process a PDF file for vector storage
 * @param file PDF file to process
 * @returns Object containing extracted text and chunks
 */
export async function processPDFForVectorization(file: File): Promise<{
  fullText: string;
  chunks: string[];
  metadata: {
    filename: string;
    pageCount: number;
    fileSize: string;
  }
}> {
  try {
    // Extract text from PDF
    const fullText = await extractTextFromPDF(file);
    
    // Split text into chunks
    const chunks = chunkText(fullText);
    
    // Get PDF metadata
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    return {
      fullText,
      chunks,
      metadata: {
        filename: file.name,
        pageCount: pdf.numPages,
        fileSize: `${Math.round(file.size / 1024)} KB`
      }
    };
  } catch (error) {
    console.error('Error processing PDF for vectorization:', error);
    throw error;
  }
}
