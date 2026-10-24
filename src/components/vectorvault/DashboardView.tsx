import React, { useState, useContext } from 'react';
import { AppContext } from './contexts/AppContext';
import { FileText } from 'lucide-react';
import { BotIcon, HardDriveIcon, ZapIcon, TrashIcon, PlusIcon } from './CustomIcons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, description }) => (
  <div className="bg-white border border-line p-5 rounded-lg">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-2 rounded-full bg-paper-2">
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-ink mt-4">{value}</p>
  </div>
);

// Knowledge Query Component
const KnowledgeQuery: React.FC = () => {
  const { knowledgeBases } = useContext(AppContext);
  const [selectedKbId, setSelectedKbId] = useState<string>(knowledgeBases[0]?.id || '');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim() || !selectedKbId) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      // Simulate API call with a timeout
      setTimeout(() => {
        setResponse(`This is a simulated response to your query: "${query}" for the selected knowledge base.`);
        setIsLoading(false);
      }, 1500);
      
      // In a real implementation, we would call an API endpoint:
      // const response = await queryKnowledgeBase(query, selectedKbId);
      // setResponse(response);
    } catch (error) {
      console.error('Error querying knowledge base:', error);
      setResponse('An error occurred while querying the knowledge base.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-line p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-ink mb-4">Query Knowledge Base</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="kb-select" className="block text-sm font-medium text-muted-foreground mb-1">
            Select Knowledge Base
          </label>
          <select
            id="kb-select"
            value={selectedKbId}
            onChange={(e) => setSelectedKbId(e.target.value)}
            className="w-full bg-white border border-line rounded-md py-2 px-3 text-ink focus:ring-2 focus:ring-navy focus:outline-none"
            disabled={knowledgeBases.length === 0}
          >
            {knowledgeBases.length > 0 ? (
              knowledgeBases.map(kb => (
                <option key={kb.id} value={kb.id}>{kb.name}</option>
              ))
            ) : (
              <option value="">No knowledge bases available</option>
            )}
          </select>
        </div>
        
        <div>
          <label htmlFor="query-input" className="block text-sm font-medium text-muted-foreground mb-1">
            Your Query
          </label>
          <textarea
            id="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query here..."
            className="w-full bg-white border border-line rounded-md py-2 px-3 text-ink focus:ring-2 focus:ring-navy focus:outline-none min-h-[100px]"
            disabled={knowledgeBases.length === 0}
          />
        </div>
        
        <button
          onClick={handleQuery}
          disabled={!query.trim() || !selectedKbId || isLoading}
          className="w-full bg-navy hover:bg-navy-deep text-white py-2 px-4 rounded-md font-medium disabled:bg-line disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Querying...' : 'Submit Query'}
        </button>
        
        {response && (
          <div className="mt-4 p-4 bg-paper-2 border border-line rounded-md">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Response:</h4>
            <p className="text-ink whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardView: React.FC = () => {
  const { knowledgeBases, documents, addKnowledgeBase, deleteKnowledgeBase } = useContext(AppContext);
  const hasDocuments = documents.length > 0;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbDescription, setNewKbDescription] = useState('');

  const handleCreateKnowledgeBase = () => {
    if (newKbName.trim()) {
      addKnowledgeBase(newKbName.trim(), newKbDescription.trim());
      setNewKbName('');
      setNewKbDescription('');
      setShowCreateModal(false);
    }
  };

  const handleDeleteKnowledgeBase = (kbId: string) => {
    if (window.confirm('Are you sure you want to delete this knowledge base? All documents within it will also be deleted. This action cannot be undone.')) {
      deleteKnowledgeBase(kbId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-ink">Dashboard</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-navy hover:bg-navy-deep text-white py-2 px-4 rounded-md font-medium flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Knowledge Base</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="w-6 h-6 text-navy"/>} title="Total Documents" value={documents.length.toString()} description="Across all bases"/>
        <StatCard icon={<HardDriveIcon className="w-6 h-6 text-navy"/>} title="Total Knowledge Bases" value={knowledgeBases.length.toString()} description="Ready for queries" />
        <StatCard icon={<ZapIcon className="w-6 h-6 text-gold"/>} title="Embeddings" value="0" description="Calculated on upload"/>
        <StatCard icon={<BotIcon className="w-6 h-6 text-gold"/>} title="AI Queries" value="0" description="Tracked via API"/>
      </div>

      <div className="bg-white border border-line p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-ink mb-4">Recent Activity</h3>
         <div style={{ width: '100%', height: 300 }}>
            {hasDocuments ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#78716C" />
                        <YAxis stroke="#78716C" />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1C1917' }}/>
                        <Bar dataKey="uploads" fill="#0F2A4A" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                   <FileText className="w-12 h-12 mb-4" />
                   <h4 className="text-lg font-semibold">No Activity Yet</h4>
                   <p>Upload documents to populate this chart.</p>
                </div>
            )}
        </div>
      </div>
      
      <div className="bg-white border border-line p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-ink mb-4">Knowledge Bases</h3>
        
        {knowledgeBases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledgeBases.map(kb => (
              <div key={kb.id} className="bg-paper-2 border border-line p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-ink">{kb.name}</h4>
                    {kb.description && <p className="text-sm text-muted-foreground mt-1">{kb.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteKnowledgeBase(kb.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete knowledge base"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{kb.documentCount} documents</span>
                  <span className="text-xs text-muted-foreground">Created: {new Date(kb.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <HardDriveIcon className="w-12 h-12 mb-4" />
            <h4 className="text-lg font-semibold">No Knowledge Bases</h4>
            <p>Create a knowledge base to start uploading documents.</p>
          </div>
        )}
      </div>
      
      <KnowledgeQuery />
      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-line rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-ink mb-4">Create Knowledge Base</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="kb-name" className="block text-sm font-medium text-muted-foreground mb-1">
                  Name
                </label>
                <input
                  id="kb-name"
                  type="text"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  placeholder="Enter knowledge base name"
                  className="w-full bg-white border border-line rounded-md py-2 px-3 text-ink focus:ring-2 focus:ring-navy focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="kb-description" className="block text-sm font-medium text-muted-foreground mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="kb-description"
                  value={newKbDescription}
                  onChange={(e) => setNewKbDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full bg-white border border-line rounded-md py-2 px-3 text-ink focus:ring-2 focus:ring-navy focus:outline-none min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
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

export default DashboardView;
