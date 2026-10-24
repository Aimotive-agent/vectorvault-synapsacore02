import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface LocationState {
  requiredPermission?: string;
}

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the required permission from location state
  const locationState = location.state as LocationState;
  const requiredPermission = locationState?.requiredPermission || 'appropriate permissions';
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-paper p-4">
      <Card className="w-full max-w-md border-line">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-center text-ink">Access Denied</CardTitle>
          <CardDescription className="text-center">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4 text-muted-foreground">
            This page requires {requiredPermission} to access.
            Please contact your administrator if you believe you should have access.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Unauthorized;
