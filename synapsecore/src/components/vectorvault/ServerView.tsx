import React, { useContext, useState } from 'react';
import { AppContext } from './contexts/AppContext';
import { Server, Download, Copy, Key, Trash2, X } from 'lucide-react';

const ServerView: React.FC = () => {
  const { knowledgeBases, apiKeys, generateApiKey, revokeApiKey, exportDataForServer } = useContext(AppContext);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyName, setApiKeyName] = useState('');
  const [selectedKbId, setSelectedKbId] = useState<string>(knowledgeBases[0]?.id || '');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [serverData, setServerData] = useState<string | null>(null);

  const handleExportData = () => {
    const data = exportDataForServer();
    setServerData(data);
  };

  const handleCopyData = () => {
    if (serverData) {
      navigator.clipboard.writeText(serverData)
        .then(() => alert('Server data copied to clipboard!'))
        .catch(err => console.error('Failed to copy data:', err));
    }
  };

  const handleGenerateApiKey = () => {
    if (!apiKeyName.trim() || !selectedKbId) return;
    
    const newKey = generateApiKey(apiKeyName, selectedKbId);
    if (newKey) {
      setNewApiKey(newKey.key);
      setApiKeyName('');
      // Keep the modal open to show the new key
    }
  };

  const closeGenerateModal = () => {
    setShowApiKeyModal(false);
    setNewApiKey(null);
  }

  const handleCopyKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey)
        .then(() => {
          alert('API Key copied to clipboard!');
          closeGenerateModal();
        })
        .catch(err => console.error('Failed to copy key:', err));
    }
  };


  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Server Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Keys Section */}
        <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">API Keys</h3>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="bg-brand-purple hover:bg-brand-purple/90 text-white py-2 px-4 rounded-md flex items-center space-x-2 transition-colors"
              disabled={knowledgeBases.length === 0}
            >
              <Key className="w-5 h-5" />
              <span>Generate API Key</span>
            </button>
          </div>
          <div className="space-y-3">
            {apiKeys.length > 0 ? apiKeys.map(apiKey => (
              <div key={apiKey.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                <div>
                  <p className="font-medium text-white">{apiKey.name}</p>
                  <p className="text-sm text-gray-400">
                    Access: {knowledgeBases.find(kb => kb.id === apiKey.knowledgeBaseId)?.name || 'N/A'}
                  </p>
                </div>
                <button 
                  onClick={() => revokeApiKey(apiKey.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-4">No API keys generated.</p>
            )}
          </div>
        </div>

        {/* Export Data Section */}
        <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-4">Export Data</h3>
          <p className="text-gray-400 mb-4">
            Export all knowledge base and document data for use on a different server.
          </p>
          <button
            onClick={handleExportData}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors mb-4"
          >
            <Download className="w-5 h-5" />
            <span>Export Data</span>
          </button>
          {serverData && (
            <div className="space-y-2">
              <textarea
                readOnly
                value={serverData}
                className="w-full h-32 bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-300 text-xs"
              />
              <button
                onClick={handleCopyData}
                className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors"
              >
                <Copy className="w-5 h-5" />
                <span>Copy Data</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generate API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-md m-4 border border-gray-700">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{newApiKey ? 'Your New API Key' : 'Generate API Key'}</h2>
              <button onClick={closeGenerateModal} className="p-1.5 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              {newApiKey ? (
                <div className="space-y-4">
                  <p className="text-gray-400">Here is your new API key. Store it securely, as you will not be able to see it again.</p>
                  <div className="bg-gray-800 p-3 rounded-md font-mono text-brand-purple text-sm break-all">
                    {newApiKey}
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="w-full px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Copy className="w-5 h-5"/>
                    <span>Copy Key & Close</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="api-kb" className="block text-sm font-medium text-gray-400 mb-1">
                      Knowledge Base Access
                    </label>
                    <select
                      id="api-kb"
                      value={selectedKbId}
                      onChange={(e) => setSelectedKbId(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                      required
                    >
                      {knowledgeBases.map(kb => (
                        <option key={kb.id} value={kb.id}>{kb.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="api-name" className="block text-sm font-medium text-gray-400 mb-1">
                      Key Name
                    </label>
                    <input
                      id="api-name"
                      type="text"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      placeholder="Enter a name for this API key"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={closeGenerateModal}
                      className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateApiKey}
                      disabled={!apiKeyName.trim() || !selectedKbId}
                      className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      Generate
                    </button>
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

export default ServerView;
