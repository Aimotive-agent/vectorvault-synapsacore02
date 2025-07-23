
import React, { useState, useCallback, useContext } from 'react';
import { UploadCloud } from './icons';
import { AppContext } from '../contexts/AppContext';
import { DocumentStatus } from '../types';

interface UploadableFile {
  id: string;
  file: File;
  progress: number;
}

const getFileType = (fileName: string): 'PDF' | 'DOCX' | 'TXT' | 'MD' | 'CSV' | 'XLSX' => {
    const ext = fileName.split('.').pop()?.toUpperCase() || '';
    if (['PDF', 'DOCX', 'TXT', 'MD', 'CSV', 'XLSX'].includes(ext)) {
        return ext as 'PDF' | 'DOCX' | 'TXT' | 'MD' | 'CSV' | 'XLSX';
    }
    return 'TXT'; // Fallback
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


const FileProgress: React.FC<{ file: File, progress: number }> = ({ file, progress }) => (
    <div className="text-sm">
        <div className="flex justify-between items-center">
            <p className="text-slate-300 truncate w-4/5">{file.name}</p>
            <p className="text-slate-400">{progress}%</p>
        </div>
        <div className="w-full bg-slate-600 rounded-full h-1.5 mt-1">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
    </div>
);

interface FileUploadProps {
  knowledgeBaseId: string;
  onUploadComplete: () => void;
}

// --- PDF.js Loader ---
// This new loader uses dynamic module imports from a reliable CDN. It's robust,
// CSP-friendly, and provides clear error handling if the network request fails.
let pdfjsLibPromise: Promise<any> | null = null;

const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs';
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';

const loadPdfjs = (): Promise<any> => {
    if (pdfjsLibPromise) {
        return pdfjsLibPromise;
    }

    pdfjsLibPromise = new Promise(async (resolve, reject) => {
        try {
            // Dynamically import the PDF.js library module.
            const pdfjsModule = await import(PDF_JS_URL);
            
            // The worker is essential for performance and must be loaded by its URL.
            pdfjsModule.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

            // Resolve with the entire module, which contains getDocument, etc.
            resolve(pdfjsModule);

        } catch (error) {
            console.error("Fatal: Failed to load PDF.js library from CDN:", error);
            // Reset promise to allow retry on subsequent attempts.
            pdfjsLibPromise = null;
            reject(new Error("PDF library failed to load from network. Check connection/ad-blockers."));
        }
    });

    return pdfjsLibPromise;
};
// --------------------

const FileUpload: React.FC<FileUploadProps> = ({ knowledgeBaseId, onUploadComplete }) => {
  const { addDocument, updateDocumentStatus } = useContext(AppContext);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const simulateUpload = useCallback((id: string) => {
    const interval = setInterval(() => {
        setFiles(prevFiles => prevFiles.map(f => {
            if (f.id === id && f.progress < 100) {
                return { ...f, progress: f.progress + 10 };
            }
            return f;
        }));
    }, 200);

    setTimeout(() => {
        clearInterval(interval);
        setFiles(prevFiles => prevFiles.map(f => f.id === id ? { ...f, progress: 100 } : f));
        updateDocumentStatus(id, DocumentStatus.Indexed);
    }, 2100);
  }, [updateDocumentStatus]);

  const processAndUpload = useCallback(async (droppedFiles: FileList | null) => {
      if (!droppedFiles || droppedFiles.length === 0) return;
      
      setIsProcessing(true);

      for (const file of Array.from(droppedFiles)) {
          const fileType = getFileType(file.name);
          let content = `[Content of the ${fileType} file '${file.name}' is not supported for reading.]`;
          let errorOccurred = false;

          try {
              if (fileType === 'PDF') {
                  const pdfjsLib = await loadPdfjs();
                  
                  content = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                          try {
                              if (!event.target?.result) {
                                  return reject(new Error('Failed to read PDF file locally.'));
                              }
                              const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
                              const loadingTask = pdfjsLib.getDocument(typedArray);
                              const pdf = await loadingTask.promise;
                              let fullText = '';
                              for (let i = 1; i <= pdf.numPages; i++) {
                                  const page = await pdf.getPage(i);
                                  const textContent = await page.getTextContent();
                                  const pageText = textContent.items.map((item: any) => item.str).join(' ');
                                  fullText += pageText + '\n\n';
                              }
                              resolve(fullText.trim());
                          } catch (pdfError) {
                              console.error('Error parsing PDF:', pdfError);
                              reject(new Error(`Failed to parse PDF: ${file.name}. It may be corrupted or password-protected.`));
                          }
                      };
                      reader.onerror = () => reject(new Error(`Error reading file from disk: ${file.name}`));
                      reader.readAsArrayBuffer(file);
                  });
              } else if (['TXT', 'MD', 'CSV'].includes(fileType)) {
                  content = await file.text();
              }
          } catch (e) {
              console.error(e);
              if (e instanceof Error) {
                  // This will now catch descriptive errors from loadPdfjs or the parsing logic.
                  content = `[Error processing file ${file.name}: ${e.message}]`;
              } else {
                  content = `[An unknown error occurred while processing ${file.name}]`;
              }
              errorOccurred = true;
          }

          const newDoc = addDocument({
              knowledgeBaseId,
              name: file.name,
              type: fileType,
              size: formatBytes(file.size),
              tags: errorOccurred ? ['error'] : ['new'],
              content: content,
          });

          if (errorOccurred) {
              updateDocumentStatus(newDoc.id, DocumentStatus.Error);
          } else {
              const uploadable: UploadableFile = { id: newDoc.id, file, progress: 0 };
              setFiles(prev => [...prev, uploadable]);
              simulateUpload(newDoc.id);
          }
      }
      setIsProcessing(false);
  }, [knowledgeBaseId, addDocument, updateDocumentStatus, simulateUpload]);


  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;
    processAndUpload(e.dataTransfer.files);
  }, [processAndUpload, isProcessing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing) return;
      processAndUpload(e.target.files);
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); if (!isProcessing) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
        <input type="file" id="file-upload-input" multiple onChange={handleFileChange} className="hidden" disabled={isProcessing} accept=".pdf,.txt,.md,.csv"/>
        <label
            htmlFor="file-upload-input"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
              isProcessing 
              ? 'border-slate-700 bg-slate-800 cursor-not-allowed'
              : isDragging 
                ? 'border-indigo-500 bg-slate-700/50 cursor-pointer' 
                : 'border-slate-600 hover:border-slate-500 cursor-pointer'
            }`}
        >
            <UploadCloud className={`w-12 h-12 ${isProcessing ? 'text-slate-600' : 'text-slate-500'}`} />
            <p className={`mt-2 text-sm ${isProcessing ? 'text-slate-600' : 'text-slate-400'}`}>
            {isProcessing ? 'Processing files...' : <><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</>}
            </p>
            <p className={`text-xs ${isProcessing ? 'text-slate-700' : 'text-slate-500'}`}>PDF, TXT, MD, and CSV files will have their content indexed.</p>
        </label>
        {files.length > 0 && (
            <div className="mt-4 space-y-3 overflow-y-auto flex-1">
                <h4 className="font-semibold text-slate-200">Current Uploads</h4>
                {files.map(f => <FileProgress key={f.id} file={f.file} progress={f.progress} />)}
            </div>
        )}
    </div>
  );
};

export default FileUpload;
