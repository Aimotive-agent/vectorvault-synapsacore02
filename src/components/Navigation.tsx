import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, Database } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-indigo-500" />
              <span className="text-xl font-bold text-white">SynapseCore</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPath === '/' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              AI Chat
            </Link>
            
            <Link 
              to="/vectorvault" 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                currentPath === '/vectorvault' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Vector Vault</span>
            </Link>
            
            <Link 
              to="/auth" 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPath === '/auth' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
