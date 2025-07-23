import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Set up the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => (item as any).str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
};
