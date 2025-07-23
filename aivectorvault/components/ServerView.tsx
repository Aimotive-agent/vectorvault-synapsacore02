import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { KeyRound, Copy, PlusCircle, Trash2 } from './icons';
import type { ApiKey } from '../types';

// Error boundary component for handling errors in the server view
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
    constructor(props: {children: React.ReactNode}) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-900/20 rounded-lg border border-red-800">
                    <h3 className="text-lg font-semibold text-red-400">Server Configuration Error</h3>
                    <p className="text-slate-300 mt-2">There was an error loading the server configuration. Please try refreshing the page.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * The main ServerView component for API key management
 */
const ServerView = () => {
    const { apiKeys, knowledgeBases, generateApiKey, revokeApiKey: contextRevokeApiKey } = useContext(AppContext);
    const [newApiKeyName, setNewApiKeyName] = useState('');
    const [showNewApiKey, setShowNewApiKey] = useState<ApiKey | null>(null);
    const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState('');
    const [webhookBaseUrl, setWebhookBaseUrl] = useState('');
    const [webhookCopied, setWebhookCopied] = useState(false);
    
    // Set the first knowledge base as default when the component loads
    React.useEffect(() => {
        if (knowledgeBases.length > 0 && !selectedKnowledgeBase) {
            setSelectedKnowledgeBase(knowledgeBases[0].id);
        }
        
        // Determine the base URL for webhooks
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // Handle production domain
        if (hostname === 'aivectorvault.site' || hostname.includes('netlify.app')) {
            // In production, use the main domain
            setWebhookBaseUrl(`${protocol}//api.aivectorvault.site/api/mcp/webhook`);
        } else {
            // In development or other environments
            const port = window.location.port === '3000' ? '3001' : window.location.port; // API server runs on 3001 in dev
            setWebhookBaseUrl(`${protocol}//${hostname}${port ? `:${port}` : ''}/api/mcp/webhook`);
        }
    }, [knowledgeBases]);
    
    // Copy webhook URL to clipboard
    const copyWebhookUrl = (endpoint: string) => {
        const fullUrl = `${webhookBaseUrl}/${endpoint}`;
        navigator.clipboard.writeText(fullUrl);
        setWebhookCopied(true);
        setTimeout(() => setWebhookCopied(false), 2000);
    };
    
    // Generate a new API key
    const handleGenerateKey = () => {
        if (!newApiKeyName.trim() || !selectedKnowledgeBase) return;
        
        // Use the context's generateApiKey function with the selected knowledge base
        const newKey = generateApiKey(newApiKeyName, selectedKnowledgeBase);
        
        if (newKey) {
            // Show the new key to the user
            setShowNewApiKey(newKey);
            
            // Reset the input field
            setNewApiKeyName('');
        } else {
            // Show an error if the key couldn't be generated
            alert('Could not generate API key. Please make sure a valid knowledge base is selected.');
        }
    };
    
    // Revoke an API key
    const handleRevokeApiKey = (id: string) => {
        if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
            contextRevokeApiKey(id);
        }
    };
    
    return (
        <ErrorBoundary>
            <div className="space-y-8">
                {/* Webhook Management */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="border-b border-slate-700 p-4">
                        <div className="flex items-center space-x-3">
                            <KeyRound className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold text-white">Webhooks</h2>
                        </div>
                        <p className="text-slate-400 mt-2">
                            Access your knowledge bases via webhooks for integration with other services.
                        </p>
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-6">
                            <div className="bg-slate-700/50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-white mb-2">All Knowledge Bases</h3>
                                <p className="text-sm text-slate-400 mb-3">
                                    Access all data from all knowledge bases in a single request.
                                </p>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${webhookBaseUrl}/all`}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-slate-300 font-mono text-sm"
                                    />
                                    <button
                                        onClick={() => copyWebhookUrl('all')}
                                        className="ml-2 p-2 bg-purple-700 rounded-md hover:bg-purple-600 transition-colors"
                                        title="Copy webhook URL"
                                    >
                                        <Copy className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                                {webhookCopied && (
                                    <p className="text-green-400 text-xs mt-2">Webhook URL copied to clipboard!</p>
                                )}
                                <div className="mt-3 text-xs text-slate-400">
                                    <p className="font-semibold">Usage:</p>
                                    <p className="mt-1">Send a GET request to this endpoint to retrieve all knowledge base data.</p>
                                </div>
                            </div>
                            
                            <div className="bg-slate-700/50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-white mb-2">Documentation</h3>
                                <p className="text-sm text-slate-400">
                                    For more information on using webhooks and the MCP API, visit the API documentation.
                                </p>
                                <a 
                                    href="/api" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    View API Documentation →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* API Keys Management */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="border-b border-slate-700 p-4">
                        <div className="flex items-center space-x-3">
                            <KeyRound className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-semibold text-white">API Keys</h2>
                        </div>
                        <p className="text-slate-400 mt-2">
                            Manage API keys for accessing your knowledge base programmatically.
                        </p>
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="New API key name..."
                                    value={newApiKeyName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewApiKeyName(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleGenerateKey()}
                                    className="w-full max-w-xs bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <button 
                                    onClick={handleGenerateKey} 
                                    disabled={!newApiKeyName.trim() || !selectedKnowledgeBase} 
                                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    <PlusCircle className="w-5 h-5"/>
                                    <span>Generate Key</span>
                                </button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <label className="text-slate-300 mr-2">Knowledge Base:</label>
                                <select
                                    value={selectedKnowledgeBase}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedKnowledgeBase(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    {knowledgeBases.length === 0 && (
                                        <option value="" disabled>No knowledge bases available</option>
                                    )}
                                    {knowledgeBases.map(kb => (
                                        <option key={kb.id} value={kb.id}>{kb.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {showNewApiKey && (
                            <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-green-400">API Key Generated: {showNewApiKey.name}</h4>
                                    <button 
                                        onClick={() => setShowNewApiKey(null)}
                                        className="text-slate-400 hover:text-slate-300"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={showNewApiKey.key} 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-300 font-mono text-sm"
                                    />
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(showNewApiKey.key)}
                                        className="ml-2 p-2 bg-green-700 rounded-md hover:bg-green-600 transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">⚠️ <strong>Important:</strong> Save this key now. For security reasons, it will not be displayed again.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Key</th>
                                <th scope="col" className="px-6 py-3">Created On</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {apiKeys.map((key) => (
                                <tr key={key.id} className="bg-slate-800 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50">
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{key.name}</th>
                                    <td className="px-6 py-4 font-mono text-xs">{key.displayKey}</td>
                                    <td className="px-6 py-4">{key.createdAt}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleRevokeApiKey(key.id)} className="font-medium text-red-500 hover:text-red-400 flex items-center space-x-1 p-1"><Trash2 className="w-4 h-4"/><span>Revoke</span></button>
                                    </td>
                                </tr>
                            ))}
                            {apiKeys.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-8 text-slate-500">No API keys generated yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default ServerView;
