import React, { useState, useContext } from 'react';
import { AppContext } from './contexts/AppContext';
import { Settings, Plus, Trash, X } from 'lucide-react';
import { vectorVaultService } from '../../services/vectorVaultService';

const SettingsView: React.FC = () => {
  const { knowledgeBases, addKnowledgeBase, deleteKnowledgeBase } = useContext(AppContext);
  const [newKbName, setNewKbName] = useState('');
  const [showCreateKbModal, setShowCreateKbModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreateKnowledgeBase = () => {
    if (!newKbName.trim()) return;
    
    addKnowledgeBase(newKbName);
    setNewKbName('');
    setShowCreateKbModal(false);
  };

  const handleDeleteKnowledgeBase = async (kbId: string) => {
    if (!kbId || isDeleting) return;
    
    setIsDeleting(kbId);
    setDeleteError(null);
    
    try {
      const success = deleteKnowledgeBase(kbId);
      
      if (!success) {
        await vectorVaultService.deleteKnowledgeBase(kbId);
      }
      
      console.log(`Successfully deleted knowledge base ${kbId}`);
    } catch (error) {
      console.error(`Error deleting knowledge base ${kbId}:`, error);
      setDeleteError(`Failed to delete knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Bases Section - takes 2/3 width */}
        <div className="lg:col-span-2 bg-dark-card p-6 rounded-lg shadow-lg border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Knowledge Bases</h3>
            <button
              onClick={() => setShowCreateKbModal(true)}
              className="bg-brand-purple hover:bg-brand-purple/90 text-white py-2 px-4 rounded-md flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create New</span>
            </button>
          </div>
          {deleteError && (
            <div className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4">
              {deleteError}
            </div>
          )}
          <div className="space-y-3">
            {knowledgeBases.map(kb => (
              <div key={kb.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                <div>
                  <p className="font-medium text-white">{kb.name}</p>
                  <p className="text-sm text-gray-400">{kb.documentCount || 0} documents</p>
                </div>
                <button 
                  onClick={() => handleDeleteKnowledgeBase(kb.id)}
                  disabled={isDeleting === kb.id}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isDeleting === kb.id ? 
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : 
                    <Trash className="w-4 h-4" />
                  }
                </button>
              </div>
            ))}
            {knowledgeBases.length === 0 && (
              <p className="text-center text-gray-500 py-4">No knowledge bases created.</p>
            )}
          </div>
        </div>

        {/* AI Provider Section - takes 1/3 width */}
        <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-4">AI Provider</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-400 mb-1">
                AI Provider
              </label>
              <select
                id="ai-provider"
                value="gemini"
                disabled
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none disabled:opacity-70"
              >
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            <div className="pt-2">
              <button className="w-full px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90 transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Knowledge Base Modal */}
      {showCreateKbModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-md m-4 border border-gray-700">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Create Knowledge Base</h3>
              <button onClick={() => setShowCreateKbModal(false)} className="p-1.5 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="kb-name" className="block text-sm font-medium text-gray-400 mb-1">
                    Knowledge Base Name
                  </label>
                  <input
                    id="kb-name"
                    type="text"
                    value={newKbName}
                    onChange={(e) => setNewKbName(e.target.value)}
                    placeholder="Enter a name for your knowledge base"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateKbModal(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKnowledgeBase}
                    disabled={!newKbName.trim()}
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
