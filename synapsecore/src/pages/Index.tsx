import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

const Index = () => {
  const { user, loading: isLoading, logout: signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Loading SynapseCore...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-end p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Welcome, {user.email}</span>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="bg-transparent border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white transition-all duration-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Index;
