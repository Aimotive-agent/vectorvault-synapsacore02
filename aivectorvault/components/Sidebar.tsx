
import React from 'react';
import type { View } from '../types';
import { LayoutDashboard, FileText, Server, Settings, HardDrive, MessageSquare } from './icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  view: View;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-slate-700 text-white'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { view: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { view: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { view: 'server', label: 'MCP Server', icon: <Server className="w-5 h-5" /> },
    { view: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
      <div className="flex items-center mb-8">
        <HardDrive className="w-8 h-8 text-indigo-400" />
        <h1 className="ml-2 text-2xl font-bold text-white">VectorVault</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.view}
            icon={item.icon}
            label={item.label}
            view={item.view}
            isActive={currentView === item.view}
            onClick={() => setCurrentView(item.view)}
          />
        ))}
      </nav>
      <div className="mt-auto">
        <div className="p-4 rounded-lg bg-slate-800">
            <p className="text-sm font-semibold text-white">Jane Doe</p>
            <p className="text-xs text-slate-400">Pro Plan</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
