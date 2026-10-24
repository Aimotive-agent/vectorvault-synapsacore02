import React, { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { AppContext } from './contexts/AppContext';
import { Document, DocumentStatus } from './types';
import { 
  FileText, 
  Upload, 
  Search, 
  AlertCircle, 
  Trash, 
  X
} from 'lucide-react';
import { FilterIcon, ClockIcon, CheckCircleIcon, TagIcon } from './CustomIcons';
import { extractTextFromPdf } from '@/utils/pdfUtils';

const DocumentsView: React.FC = () => {
  const { knowledgeBases, documents, addDocument, deleteDocument, documentProgress } = useContext(AppContext);
  const [selectedKbId, setSelectedKbId] = useState<string>(knowledgeBases[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadStatus = uploadingDocId ? documentProgress[uploadingDocId] : null;

  useEffect(() => {
    if (uploadStatus?.status === 'complete' || uploadStatus?.status === 'error') {
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadingDocId(null);
      }, 2000); // Keep modal open for 2 seconds to show final status
    }
  }, [uploadStatus]);


  const filteredDocuments = documents.filter(doc => 
    (selectedKbId ? doc.knowledgeBaseId === selectedKbId : true) &&
    (searchTerm ? (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) : true)
  );

  const handleFileChange = useCallback((file: File) => {
    setSelectedFile(file);
    setUploadName(file.name);
    setShowUploadModal(true);
    setUploadingDocId(null); // Reset on new file selection
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  }, [handleFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleUpload = async () => {
    console.log('Upload initiated...');
    console.log('Selected KB ID:', selectedKbId);
    console.log('Selected File:', selectedFile?.name);

    if (!uploadName.trim() || !selectedKbId || !selectedFile) {
      console.error('Upload validation failed:', { uploadName, selectedKbId, selectedFile });
      return;
    }

    try {
      let fileContent = '';
      try {
        fileContent = selectedFile.type === 'application/pdf' 
          ? await extractTextFromPdf(selectedFile) 
          : await selectedFile.text();
      } catch (error) {
        console.error('Error reading file content:', error);
        alert('Failed to read file. Please check the console for details.');
        return;
      }

      const docToAdd: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        name: uploadName,
        title: uploadName,
        type: selectedFile.type.split('/')[1].toUpperCase() as any,
        size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
        tags: uploadTags.split(',').map(t => t.trim()).filter(t => t),
        content: fileContent,
        knowledgeBaseId: selectedKbId,
        uploadDate: new Date().toISOString(),
      };

      console.log('Attempting to add document to context...');
      const newDoc = await addDocument(docToAdd, selectedKbId);
      console.log('Document added to context, newDoc ID:', newDoc.id);
      setUploadingDocId(newDoc.id);

    } catch (error) {
      console.error('An unexpected error occurred during the upload process:', error);
      alert('An unexpected error occurred. Please check the console for details.');
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.Processing:
        return <ClockIcon className="w-4 h-4 text-warning" />;
      case DocumentStatus.Indexed:
        return <CheckCircleIcon className="w-4 h-4 text-success" />;
      case DocumentStatus.Error:
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(docId);
    }
  };

  const resetModal = () => {
    setShowUploadModal(false);
    setUploadName('');
    setUploadTags('');
    setSelectedFile(null);
    setUploadingDocId(null);
  }

  return (
    <div className="p-6 bg-paper text-ink min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Documents</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-white border border-line rounded-md py-2 pl-10 pr-4 text-ink focus:ring-2 focus:ring-navy focus:outline-none"
            />
          </div>
          <div className="relative">
            <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <select 
              value={selectedKbId}
              onChange={(e) => setSelectedKbId(e.target.value)}
              className="w-64 bg-white border border-line rounded-md py-2 pl-10 pr-4 text-ink focus:ring-2 focus:ring-navy focus:outline-none appearance-none"
            >
              <option value="">All Knowledge Bases</option>
              {knowledgeBases.map(kb => (
                <option key={kb.id} value={kb.id}>{kb.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-navy text-white rounded-md hover:bg-navy-deep transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Upload</span>
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.txt,.md,.docx"
          />
        </div>
      </header>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 transition-colors duration-200 min-h-[200px] flex items-center justify-center ${isDragging ? 'border-navy bg-white' : 'border-line bg-white/40'}`}
      >
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="bg-white border border-line rounded-lg p-4 flex flex-col justify-between hover:border-gold/60 transition-colors">
                <div>
                  <div className="flex justify-between items-start">
                    <FileText className="w-8 h-8 text-navy" />
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc.status)}
                      <button onClick={() => handleDelete(doc.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold mt-3 truncate" title={doc.name ?? ''}>{doc.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{doc.size} - {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : ''}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(doc.tags || []).map(tag => (
                      <span key={tag} className="text-xs bg-paper-2 border border-gold/40 text-navy px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Upload className="mx-auto w-12 h-12 text-muted-foreground/60" />
            <p className="mt-4 text-muted-foreground">
              Drag and drop files here or click the upload button to add documents.
            </p>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white border border-line rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-ink">Upload Document</h2>
              <button onClick={resetModal} className="text-muted-foreground hover:text-ink">
                <X className="w-6 h-6" />
              </button>
            </div>
            {!uploadingDocId ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="upload-name" className="block text-sm font-medium text-muted-foreground mb-1">Document Name</label>
                  <input
                    id="upload-name"
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Enter document name"
                    className="w-full bg-white border border-line rounded-md py-2 px-3 text-ink focus:ring-2 focus:ring-navy focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="upload-tags" className="block text-sm font-medium text-muted-foreground mb-1">
                    Tags (comma separated)
                  </label>
                  <div className="relative">
                    <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      id="upload-tags"
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                      className="w-full bg-white border border-line rounded-md py-2 pl-10 pr-3 text-ink focus:ring-2 focus:ring-navy focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={resetModal}
                    className="px-4 py-2 bg-paper-2 border border-line text-ink rounded-md hover:bg-line transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!uploadName.trim() || !selectedKbId}
                    className="px-4 py-2 bg-navy text-white rounded-md hover:bg-navy-deep disabled:bg-line disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                  >
                    Upload
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                {uploadStatus?.status === 'processing' && (
                  <p className="text-lg text-ink">Processing: {uploadStatus.progress}%</p>
                )}
                {uploadStatus?.status === 'progress' && (
                  <p className="text-lg text-ink">Indexing: {uploadStatus.progress}%</p>
                )}
                {uploadStatus?.status === 'complete' && (
                  <div className="flex flex-col items-center text-success">
                    <CheckCircleIcon className="w-12 h-12 mb-2"/>
                    <p className="text-lg">Upload Complete!</p>
                  </div>
                )}
                {uploadStatus?.status === 'error' && (
                  <div className="flex flex-col items-center text-destructive">
                    <AlertCircle className="w-12 h-12 mb-2"/>
                    <p className="text-lg">Upload Failed</p>
                    <p className="text-sm text-muted-foreground">{documentProgress[uploadingDocId]?.error}</p>
                  </div>
                )}
                <div className="w-full bg-line rounded-full h-2.5 mt-4">
                  <div 
                    className="bg-navy h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${uploadStatus?.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
