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
import { ClockIcon, CheckCircleIcon } from './CustomIcons';
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
      const timer = setTimeout(() => {
        setShowUploadModal(false);
        setUploadingDocId(null);
      }, 2000); // Keep modal open for 2 seconds to show final status
      return () => clearTimeout(timer);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFileChange]);

  const handleUpload = async () => {
    if (!selectedFile || !selectedKbId || !uploadName.trim()) return;

    const docId = `doc_${Date.now()}`;
    setUploadingDocId(docId);

    try {
      const textContent = await extractTextFromPdf(selectedFile);
      const newDoc: Omit<Document, 'id' | 'created_at' | 'status' | 'vector_count'> = {
        name: uploadName.trim(),
        knowledgeBaseId: selectedKbId,
        content: textContent,
        size: selectedFile.size,
        tags: uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        embedding_count: 0, // Will be updated after processing
      };
      await addDocument(newDoc, docId);
    } catch (error) {
      console.error('Error processing or uploading file:', error);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getStatusPill = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.Pending:
        return <span className="px-2 py-1 text-xs font-medium text-yellow-300 bg-yellow-900/50 rounded-full">Pending</span>;
      case DocumentStatus.Completed:
        return <span className="px-2 py-1 text-xs font-medium text-green-300 bg-green-900/50 rounded-full">Completed</span>;
      case DocumentStatus.Failed:
        return <span className="px-2 py-1 text-xs font-medium text-red-300 bg-red-900/50 rounded-full">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-gray-400">Manage documents in your knowledge bases.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedFile(null);
            setUploadName('');
            setUploadTags('');
            setUploadingDocId(null);
            setShowUploadModal(true);
          }}
          className="flex items-center space-x-2 bg-brand-purple text-white px-4 py-2 rounded-lg hover:bg-brand-purple/90 transition-colors shadow-md"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-dark-card p-4 rounded-lg border border-gray-800">
        <div className="flex-1">
          <label htmlFor="kb-filter" className="text-sm font-medium text-gray-400 sr-only">Knowledge Base</label>
          <select
            id="kb-filter"
            value={selectedKbId}
            onChange={(e) => setSelectedKbId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
          >
            <option value="">All Knowledge Bases</option>
            {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-dark-card rounded-lg shadow-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-400">Name</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Knowledge Base</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Date Added</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Size</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map(doc => (
                <tr key={doc.id} className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50">
                  <td className="p-4 text-white font-medium flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-brand-purple" />
                    <span>{doc.name}</span>
                  </td>
                  <td className="p-4 text-gray-300">{knowledgeBases.find(kb => kb.id === doc.knowledgeBaseId)?.name || 'N/A'}</td>
                  <td className="p-4">{getStatusPill(doc.status)}</td>
                  <td className="p-4 text-gray-300">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-gray-300">{`${(doc.size / 1024).toFixed(2)} KB`}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => deleteDocument(doc.id, doc.knowledgeBaseId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDocuments.length === 0 && (
            <div className="text-center p-8">
              <p className="text-gray-500">No documents found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-lg m-4 border border-gray-700">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              {!uploadingDocId ? (
                <div className="space-y-4">
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                    className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-brand-purple bg-gray-800/50' : 'border-gray-700 hover:border-brand-purple'}`}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                    />
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    {selectedFile ? (
                      <p className="text-white">{selectedFile.name}</p>
                    ) : (
                      <p className="text-gray-400">Drag & drop a file here, or click to select a file</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="kb-select-modal" className="block text-sm font-medium text-gray-400 mb-1">Knowledge Base</label>
                    <select
                      id="kb-select-modal"
                      value={selectedKbId}
                      onChange={(e) => setSelectedKbId(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                    >
                      {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="upload-name" className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <input
                      id="upload-name"
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Enter document name"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="upload-tags" className="block text-sm font-medium text-gray-400 mb-1">Tags (comma-separated)</label>
                    <input
                      id="upload-tags"
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="e.g., finance, report, q3"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!uploadName.trim() || !selectedKbId}
                      className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      Upload
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {uploadStatus?.status === 'processing' && (
                    <p className="text-lg text-white">Processing: {uploadStatus.progress}%</p>
                  )}
                  {uploadStatus?.status === 'progress' && (
                    <p className="text-lg text-white">Indexing: {uploadStatus.progress}%</p>
                  )}
                  {uploadStatus?.status === 'complete' && (
                    <div className="flex flex-col items-center text-green-400">
                      <CheckCircleIcon className="w-12 h-12 mb-2"/>
                      <p className="text-lg">Upload Complete!</p>
                    </div>
                  )}
                  {uploadStatus?.status === 'error' && (
                    <div className="flex flex-col items-center text-red-400">
                      <AlertCircle className="w-12 h-12 mb-2"/>
                      <p className="text-lg">Upload Failed</p>
                      <p className="text-sm text-gray-400">{documentProgress[uploadingDocId]?.error}</p>
                    </div>
                  )}
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                    <div 
                      className="bg-brand-purple h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${uploadStatus?.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
