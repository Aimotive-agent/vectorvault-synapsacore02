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

const brandMark = new URL('brand/veritas-mark.png', document.baseURI).href;

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
    <div className="w-64 bg-navy-deep border-r border-white/10 h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <img src={brandMark} alt="Veritas Global AI" className="w-7 h-7 object-contain" />
          <div>
            <h1 className="flex items-baseline gap-1.5 text-white leading-tight">
              <span className="font-serif text-lg font-semibold">Vector</span>
              <span className="text-base font-medium text-white/90">Vault</span>
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold mt-0.5">
              Veritas SynapseCore
            </p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors ${
                  currentView === item.id
                    ? 'bg-white/10 text-gold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50 mb-2">Knowledge Bases</h3>
        <div className="space-y-1">
          {knowledgeBases.length > 0 ? (
            knowledgeBases.map((kb) => (
              <div key={kb.id} className="flex items-center justify-between px-2 py-1 text-sm text-white/70 hover:bg-white/5 rounded">
                <span className="truncate">{kb.name}</span>
                <span className="text-xs text-white/50">{kb.documentCount}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-white/50">No knowledge bases yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
