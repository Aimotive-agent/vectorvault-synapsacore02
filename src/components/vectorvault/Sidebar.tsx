import React, { useContext } from 'react';
import { View } from './types';
import { AppContext } from './contexts/AppContext';

// Import icons
import { 
  LayoutDashboard, 
  FileText, 
  Server, 
  Settings, 
  Bot,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { knowledgeBases } = useContext(AppContext);

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'documents' as View, label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { id: 'server' as View, label: 'Server', icon: <Server className="w-5 h-5" /> },
    { id: 'settings' as View, label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'chat' as View, label: 'Chat', icon: <Bot className="w-5 h-5" /> },
  ];

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Database className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">VectorVault</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">Vector Database Management</p>
      </div>
      
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors ${
                  currentView === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Knowledge Bases</h3>
        <div className="space-y-1">
          {knowledgeBases.length > 0 ? (
            knowledgeBases.map((kb) => (
              <div key={kb.id} className="flex items-center justify-between px-2 py-1 text-sm text-slate-300 hover:bg-slate-700 rounded">
                <span className="truncate">{kb.name}</span>
                <span className="text-xs text-slate-500">{kb.documentCount}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No knowledge bases yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
