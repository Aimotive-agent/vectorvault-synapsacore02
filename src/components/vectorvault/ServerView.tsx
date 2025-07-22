import React, { useContext, useState } from 'react';
import { AppContext } from './contexts/AppContext';
import { Server, Download, Copy, Key, Trash2 } from 'lucide-react';

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
      setShowApiKeyModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Server Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Keys Section */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">API Keys</h3>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-md flex items-center space-x-2 transition-colors"
              disabled={knowledgeBases.length === 0}
            >
              <Key className="w-5 h-5" />
              <span>Generate Key</span>
            </button>
          </div>
          
          {apiKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Key</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Knowledge Base</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Created</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-white">{apiKey.name}</td>
                      <td className="py-3 px-4 text-white font-mono">{apiKey.displayKey}</td>
                      <td className="py-3 px-4 text-white">{apiKey.knowledgeBaseName}</td>
                      <td className="py-3 px-4 text-white">{apiKey.createdAt}</td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => revokeApiKey(apiKey.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
              <Key className="w-12 h-12 mb-4" />
              <h4 className="text-lg font-semibold text-slate-400">No API Keys</h4>
              <p>Generate API keys to access your knowledge bases programmatically.</p>
            </div>
          )}
          
          {/* New API Key Alert */}
          {newApiKey && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-md">
              <h4 className="text-green-400 font-semibold mb-2">New API Key Generated</h4>
              <p className="text-white mb-2">Make sure to copy your API key now. You won't be able to see it again!</p>
              <div className="flex items-center space-x-2">
                <code className="bg-slate-900 p-2 rounded text-green-400 font-mono flex-1 overflow-x-auto">
                  {newApiKey}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(newApiKey);
                    alert('API key copied to clipboard!');
                  }}
                  className="p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                >
                  <Copy className="w-5 h-5 text-white" />
                </button>
              </div>
              <button 
                onClick={() => setNewApiKey(null)}
                className="mt-3 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        
        {/* Server Data Section */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Server Data</h3>
            <button
              onClick={handleExportData}
              className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-md flex items-center space-x-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Export Data</span>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-slate-300">
              Export your knowledge bases, documents, and API keys for server deployment.
            </p>
          </div>
          
          {serverData && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold text-white">Exported Data</h4>
                <button
                  onClick={handleCopyData}
                  className="p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                >
                  <Copy className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="bg-slate-900 p-4 rounded-md overflow-auto max-h-80">
                <pre className="text-slate-300 text-sm whitespace-pre-wrap">{serverData}</pre>
              </div>
            </div>
          )}
          
          {!serverData && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
              <Server className="w-12 h-12 mb-4" />
              <h4 className="text-lg font-semibold text-slate-400">No Data Exported</h4>
              <p>Click the Export Data button to view your server data.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Generate API Key</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="api-kb" className="block text-sm font-medium text-slate-400 mb-1">
                  Knowledge Base
                </label>
                <select
                  id="api-kb"
                  value={selectedKbId}
                  onChange={(e) => setSelectedKbId(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  {knowledgeBases.map(kb => (
                    <option key={kb.id} value={kb.id}>{kb.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="api-name" className="block text-sm font-medium text-slate-400 mb-1">
                  Key Name
                </label>
                <input
                  id="api-name"
                  type="text"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  placeholder="Enter a name for this API key"
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateApiKey}
                  disabled={!apiKeyName.trim() || !selectedKbId}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerView;
