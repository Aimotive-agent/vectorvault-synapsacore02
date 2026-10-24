import React, { useState, useContext } from 'react';
import { AppContext } from './contexts/AppContext';
import { Settings, Plus, Trash } from 'lucide-react';
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
      // First, try to delete using the AppContext method
      const success = deleteKnowledgeBase(kbId);
      
      if (!success) {
        // If that fails, try using the service directly
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
      <h2 className="text-3xl font-bold text-ink">Settings</h2>
      
      <div className="bg-white border border-line p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-ink">Knowledge Bases</h3>
          <button
            onClick={() => setShowCreateKbModal(true)}
            className="bg-navy hover:bg-navy-deep text-white py-2 px-4 rounded-md flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create New</span>
          </button>
        </div>
        
        {knowledgeBases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Documents</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Created</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {knowledgeBases.map((kb) => (
                  <tr key={kb.id} className="border-b border-line hover:bg-paper-2">
                    <td className="py-3 px-4 text-ink">{kb.name}</td>
                    <td className="py-3 px-4 text-ink">{kb.documentCount}</td>
                    <td className="py-3 px-4 text-ink">{kb.createdAt}</td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleDeleteKnowledgeBase(kb.id)}
                        disabled={isDeleting === kb.id}
                        className={`p-1 ${isDeleting === kb.id ? 'text-muted-foreground' : 'text-destructive hover:text-destructive/80'} transition-colors`}
                        title="Delete knowledge base"
                      >
                        {isDeleting === kb.id ? (
                          <div className="w-5 h-5 border-2 border-t-transparent border-destructive rounded-full animate-spin"></div>
                        ) : (
                          <Trash className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Settings className="w-12 h-12 mb-4" />
            <h4 className="text-lg font-semibold">No Knowledge Bases</h4>
            <p>Create a knowledge base to start organizing your documents.</p>
          </div>
        )}
      </div>
      
      <div className="bg-white border border-line p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-ink mb-4">Application Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="app-theme" className="block text-sm font-medium text-muted-foreground mb-1">
              Theme
            </label>
            <select
              id="app-theme"
              className="w-full md:w-64 bg-white border border-line rounded-md py-2 px-3 text-ink focus:ring-2 focus:ring-navy focus:outline-none"
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="system">System Preference</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              AI Model Provider
            </label>
            <div className="flex items-center space-x-2 bg-paper-2 border border-line rounded-md py-2 px-3 text-ink w-full md:w-64">
              <span className="text-success font-medium">Gemini</span>
              <span className="text-xs bg-success/10 text-success border border-success/30 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Google Gemini is the default and only AI provider for VectorVault</p>
          </div>
          
          <div className="pt-4">
            <button className="bg-navy hover:bg-navy-deep text-white py-2 px-4 rounded-md transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
      
      {/* Create Knowledge Base Modal */}
      {showCreateKbModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-line p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-ink mb-4">Create Knowledge Base</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="kb-name" className="block text-sm font-medium text-muted-foreground mb-1">
                  Knowledge Base Name
                </label>
                <input
                  id="kb-name"
                  type="text"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  placeholder="Enter a name for your knowledge base"
                  className="w-full bg-white border border-line rounded-md py-2 px-3 text-ink focus:ring-2 focus:ring-navy focus:outline-none"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateKbModal(false)}
                  className="px-4 py-2 bg-paper-2 border border-line text-ink rounded-md hover:bg-line transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKnowledgeBase}
                  disabled={!newKbName.trim()}
                  className="px-4 py-2 bg-navy text-white rounded-md hover:bg-navy-deep disabled:bg-line disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
