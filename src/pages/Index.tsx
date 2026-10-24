import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MCPWorkbench } from '@/components/mcp/MCPWorkbench';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import Navigation from '@/components/Navigation';

const Index = () => {
  const { user, loading: isLoading, logout: signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Loading...</p>
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />
      
      {/* User Header */}
      <div className="border-b border-line bg-white mt-16">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Welcome, {user.email}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <a 
                  href="https://veritasglobalai.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors"
                >
                  By Veritas Global AI
                </a>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <MCPWorkbench />
    </div>
  );
};

export default Index;
