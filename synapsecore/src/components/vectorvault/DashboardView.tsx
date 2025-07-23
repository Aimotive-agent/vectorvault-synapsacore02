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
  <div className="bg-dark-card p-5 rounded-lg shadow-lg border border-gray-800">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="p-2 rounded-full bg-gray-700">
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-white mt-4">{value}</p>
  </div>
);

const DashboardView: React.FC = () => {
  const { knowledgeBases, documents, deleteKnowledgeBase, createKnowledgeBase } = useContext(AppContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbDescription, setNewKbDescription] = useState('');

  const totalDocs = documents.length;
  const totalKbs = knowledgeBases.length;
  const totalEmbeddings = documents.reduce((acc, doc) => acc + (doc.embedding_count || 0), 0);
  const totalAiQueries = 12; // Mock data

  const chartData = knowledgeBases.map(kb => ({
    name: kb.name,
    documents: kb.documentCount,
  }));

  const handleCreateKnowledgeBase = () => {
    if (newKbName.trim()) {
      createKnowledgeBase(newKbName.trim(), newKbDescription.trim());
      setNewKbName('');
      setNewKbDescription('');
      setShowCreateModal(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">An overview of your vector database.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-brand-purple text-white px-4 py-2 rounded-lg hover:bg-brand-purple/90 transition-colors shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Knowledge Base</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<FileText className="w-6 h-6 text-blue-400" />} 
          title="Total Documents" 
          value={totalDocs.toString()} 
          description="Across all bases"
        />
        <StatCard 
          icon={<HardDriveIcon className="w-6 h-6 text-green-400" />} 
          title="Total Knowledge Bases" 
          value={totalKbs.toString()} 
          description="Ready for queries"
        />
        <StatCard 
          icon={<ZapIcon className="w-6 h-6 text-yellow-400" />} 
          title="Embeddings" 
          value={totalEmbeddings.toLocaleString()} 
          description="Calculated on upload"
        />
        <StatCard 
          icon={<BotIcon className="w-6 h-6 text-purple-400" />} 
          title="AI Queries" 
          value={totalAiQueries.toString()} 
          description="Tracked via API"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-dark-card p-6 rounded-lg shadow-lg border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    color: '#d1d5db'
                  }} 
                />
                <Bar dataKey="documents" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <FileText className="w-12 h-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-white">No Activity Yet</h3>
              <p className="text-sm text-gray-400">Upload documents to populate this chart.</p>
            </div>
          )}
        </div>

        {/* Knowledge Bases List */}
        <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Knowledge Bases</h2>
          <div className="space-y-3">
            {knowledgeBases.length > 0 ? (
              knowledgeBases.map((kb) => (
                <div key={kb.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                  <div>
                    <p className="font-semibold text-white">{kb.name}</p>
                    <p className="text-xs text-gray-400">{kb.documentCount} documents</p>
                  </div>
                  <button 
                    onClick={() => deleteKnowledgeBase(kb.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No knowledge bases created.</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Knowledge Base Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-md m-4 border border-gray-700">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Create New Knowledge Base</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="kb-name" className="block text-sm font-medium text-gray-400 mb-1">
                  Name
                </label>
                <input
                  id="kb-name"
                  type="text"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  placeholder="Enter knowledge base name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="kb-description" className="block text-sm font-medium text-gray-400 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="kb-description"
                  value={newKbDescription}
                  onChange={(e) => setNewKbDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
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
      )}
    </div>
  );
};

export default DashboardView;
