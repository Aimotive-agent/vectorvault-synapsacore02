import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '../components/vectorvault/contexts/AppContext';
import Sidebar from '../components/vectorvault/Sidebar';
import DashboardView from '../components/vectorvault/DashboardView';
import DocumentsView from '../components/vectorvault/DocumentsView';
import ServerView from '../components/vectorvault/ServerView';
import SettingsView from '../components/vectorvault/SettingsView';
import ChatView from '../components/vectorvault/ChatView';
import Navigation from '@/components/Navigation';
import { View } from '../components/vectorvault/types';


const VectorVault: React.FC = () => {
  const { user, loading: isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

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
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <Navigation />
      
      <div className="flex pt-16 h-[calc(100vh-64px)]">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex-1 p-6 overflow-y-auto">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default VectorVault;
