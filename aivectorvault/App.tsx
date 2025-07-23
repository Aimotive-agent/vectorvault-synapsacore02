import React, { useState, useCallback } from 'react';
import type { View } from './types';
import { AppProvider } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import DocumentsView from './components/DocumentsView';
import ServerView from './components/ServerView';
import SettingsView from './components/SettingsView';
import ChatView from './components/ChatView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderView = useCallback(() => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'documents':
        return <DocumentsView />;
      case 'server':
        return <ServerView />;
      case 'settings':
        return <SettingsView />;
      case 'chat':
        return <ChatView />;
      default:
        return <DashboardView />;
    }
  }, [currentView]);

  return (
    <AppProvider>
      <div className="flex h-screen bg-slate-900 font-sans">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 overflow-y-auto p-8">
          {renderView()}
        </main>
      </div>
    </AppProvider>
  );
};

export default App;
