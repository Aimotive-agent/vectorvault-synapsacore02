
import React, { useState, useCallback, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HardDrive, FileText, Zap, Bot, Search } from './icons';
import { queryKnowledgeBase } from '../services/geminiService';
import { AppContext } from '../contexts/AppContext';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; description: string }> = ({ icon, title, value, description }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex items-center">
        <div className="p-3 rounded-full bg-slate-700 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    </div>
);

const KnowledgeQuery: React.FC = () => {
    const { knowledgeBases, documents } = useContext(AppContext);
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedKbId, setSelectedKbId] = useState<string>(knowledgeBases[0]?.id || '');

    const handleQuery = useCallback(async () => {
        if (!query.trim() || !selectedKbId) return;
        
        const kb = knowledgeBases.find(k => k.id === selectedKbId);
        if (!kb) return;

        setIsLoading(true);
        setResponse('');
        try {
            const result = await queryKnowledgeBase(query, kb.name, kb.id, documents);
            setResponse(result);
        } catch (error) {
            setResponse('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [query, selectedKbId, knowledgeBases, documents]);

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center"><Bot className="w-5 h-5 mr-2 text-indigo-400"/>Ask a Knowledge Base</h3>
                <select 
                    value={selectedKbId}
                    onChange={e => setSelectedKbId(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-md py-1 px-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    aria-label="Select a knowledge base to query"
                    disabled={knowledgeBases.length === 0}
                >
                     {knowledgeBases.length > 0 ? (
                        knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)
                     ) : (
                        <option>No knowledge bases</option>
                     )}
                </select>
            </div>
            <div className="relative">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., What were the key takeaways from the 2023 annual report?"
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 pr-24 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    rows={3}
                    disabled={isLoading || knowledgeBases.length === 0}
                />
                 <button 
                    onClick={handleQuery}
                    disabled={isLoading || !query.trim() || knowledgeBases.length === 0}
                    className="absolute top-1/2 right-3 -translate-y-1/2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                   {isLoading ? 'Thinking...' : <><Search className="w-4 h-4 mr-2"/>Query</>}
                </button>
            </div>
            {response && (
                 <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{response}</p>
                 </div>
            )}
        </div>
    );
};

const DashboardView: React.FC = () => {
    const { documents, knowledgeBases } = useContext(AppContext);
    
    const hasDocuments = documents.length > 0;
    
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<FileText className="w-6 h-6 text-blue-400"/>} title="Total Documents" value={documents.length.toString()} description="Across all bases"/>
                <StatCard icon={<HardDrive className="w-6 h-6 text-green-400"/>} title="Total Knowledge Bases" value={knowledgeBases.length.toString()} description="Ready for queries" />
                <StatCard icon={<Zap className="w-6 h-6 text-yellow-400"/>} title="Embeddings" value="0" description="Calculated on upload"/>
                <StatCard icon={<Bot className="w-6 h-6 text-indigo-400"/>} title="AI Queries" value="0" description="Tracked via API"/>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                 <div style={{ width: '100%', height: 300 }}>
                    {hasDocuments ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                                <Bar dataKey="uploads" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                           <FileText className="w-12 h-12 mb-4" />
                           <h4 className="text-lg font-semibold text-slate-400">No Activity Yet</h4>
                           <p>Upload documents to populate this chart.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <KnowledgeQuery />
        </div>
    );
};

export default DashboardView;
