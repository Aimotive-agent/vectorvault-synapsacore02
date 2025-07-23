import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { Document } from '../types';
import { DocumentStatus } from '../types';
import { Search, PlusCircle, FileText } from './icons';
import FileUpload from './FileUpload';

const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full inline-block";
  const statusClasses = {
    [DocumentStatus.Indexed]: "bg-green-500/20 text-green-400",
    [DocumentStatus.Processing]: "bg-yellow-500/20 text-yellow-400 animate-pulse",
    [DocumentStatus.Error]: "bg-red-500/20 text-red-400",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const UploadModal: React.FC<{ kbId: string, onClose: () => void }> = ({ kbId, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-2xl mx-4 p-4 border border-slate-700" onClick={e => e.stopPropagation()}>
                <FileUpload knowledgeBaseId={kbId} onUploadComplete={onClose} />
            </div>
        </div>
    );
};


const DocumentsView: React.FC = () => {
    const { knowledgeBases, documents, addKnowledgeBase } = useContext(AppContext);
    const [selectedKbId, setSelectedKbId] = useState<string | null>(knowledgeBases[0]?.id || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newKbName, setNewKbName] = useState('');
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);

    const handleCreateKb = () => {
        if (!newKbName.trim()) return;
        const newKb = addKnowledgeBase(newKbName);
        setNewKbName('');
        setSelectedKbId(newKb.id);
    };

    const filteredDocuments = useMemo(() => {
        if (!selectedKbId) return [];
        return documents.filter(doc =>
            doc.knowledgeBaseId === selectedKbId &&
            (doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [selectedKbId, searchTerm, documents]);

  return (
    <div className="space-y-6">
      {isUploadModalOpen && selectedKbId && <UploadModal kbId={selectedKbId} onClose={() => setUploadModalOpen(false)} />}
      <h2 className="text-3xl font-bold text-white">Documents</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-white px-2">Knowledge Bases</h3>
            <div className="space-y-2">
                {knowledgeBases.map(kb => (
                    <button key={kb.id} onClick={() => setSelectedKbId(kb.id)} className={`w-full text-left p-3 rounded-lg transition-colors flex justify-between items-center ${selectedKbId === kb.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                        <div>
                            <p className="font-semibold">{kb.name}</p>
                            <p className="text-xs text-slate-400">{documents.filter(d => d.knowledgeBaseId === kb.id).length} documents</p>
                        </div>
                    </button>
                ))}
            </div>
            <div className="flex items-center space-x-2 p-2">
                <input
                    type="text"
                    placeholder="New base name..."
                    value={newKbName}
                    onChange={e => setNewKbName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleCreateKb()}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button onClick={handleCreateKb} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-slate-600" disabled={!newKbName.trim()}>
                    <PlusCircle className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="lg:col-span-3">
             <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"/>
                <input
                    type="text"
                    placeholder="Search documents in this base..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={!selectedKbId}
                />
                </div>
                <button 
                    onClick={() => setUploadModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center space-x-2" 
                    disabled={!selectedKbId}>
                    <PlusCircle className="w-5 h-5" />
                    <span>Upload</span>
                </button>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">Type</th>
                        <th scope="col" className="px-6 py-3">Size</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Tags</th>
                        <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredDocuments.length > 0 ? filteredDocuments.map(doc => (
                        <tr key={doc.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{doc.name}</th>
                        <td className="px-6 py-4">{doc.type}</td>
                        <td className="px-6 py-4">{doc.size}</td>
                        <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                        <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                            {doc.tags.map(tag => (
                                <span key={tag} className="bg-slate-700 text-slate-300 text-xs font-medium px-2 py-0.5 rounded">{tag}</span>
                            ))}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <a href="#" className="font-medium text-indigo-400 hover:underline">Edit</a>
                        </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-500">
                                <FileText className="w-10 h-10 mx-auto mb-2" />
                                {selectedKbId ? 'No documents found. Try uploading some!' : 'Select or create a knowledge base to view documents.'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsView;
