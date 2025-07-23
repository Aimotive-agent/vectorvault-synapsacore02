import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Database, Settings } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-dark-card p-6 flex flex-col justify-between">
      <div>
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-brand-purple">SynapseCore</h1>
        </div>
        <nav>
          <ul>
            <li className="mb-4">
              <NavLink to="/dashboard" className={({ isActive }) => `flex items-center p-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                <Home className="mr-4" />
                Dashboard
              </NavLink>
            </li>
            <li className="mb-4">
              <NavLink to="/ai-chat" className={({ isActive }) => `flex items-center p-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                <MessageSquare className="mr-4" />
                AI Chat
              </NavLink>
            </li>
            <li className="mb-4">
              <NavLink to="/vector-vault" className={({ isActive }) => `flex items-center p-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                <Database className="mr-4" />
                Vector Vault
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <div>
        <NavLink to="/settings" className={({ isActive }) => `flex items-center p-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
          <Settings className="mr-4" />
          Settings
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
