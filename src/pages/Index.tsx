import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MCPWorkbench } from '@/components/mcp/MCPWorkbench';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
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
      {/* User Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Welcome, {user.email}</span>
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
