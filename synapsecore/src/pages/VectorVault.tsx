import React, { useState } from 'react';
import Sidebar from '../components/vectorvault/Sidebar';
import DashboardView from '../components/vectorvault/DashboardView';
import DocumentsView from '../components/vectorvault/DocumentsView';
import ServerView from '../components/vectorvault/ServerView';
import SettingsView from '../components/vectorvault/SettingsView';
import ChatView from '../components/vectorvault/ChatView';
import { View } from '../components/vectorvault/types';

const VectorVault: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);

  const renderView = () => {
    switch (currentView) {
      case View.Dashboard:
        return <DashboardView />;
      case View.Documents:
        return <DocumentsView />;
      case View.Server:
        return <ServerView />;
      case View.Settings:
        return <SettingsView />;
      case View.Chat:
        return <ChatView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-8 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default VectorVault;
