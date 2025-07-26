import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

/**
 * A wrapper component that protects routes requiring authentication
 * Redirects to login if user is not authenticated or lacks required permission
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check for login success flag from sessionStorage
  const loginSuccess = sessionStorage.getItem('login_success') === 'true';
  
  useEffect(() => {
    // If auth state is no longer loading, mark auth as checked
    if (!loading) {
      setAuthChecked(true);
      
      // Clear login success flag after it's been processed
      if (loginSuccess) {
        console.log('Login success flag found, clearing...');
        sessionStorage.removeItem('login_success');
      }
    }
  }, [loading, loginSuccess]);

  // If still loading auth state, show loading indicator
  if (loading || !authChecked) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login...');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If permission is required but user doesn't have it, redirect to unauthorized
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log(`Missing required permission: ${requiredPermission}, redirecting to unauthorized...`);
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has required permissions
  console.log('Authentication successful, rendering protected content...');
  return <>{children}</>;
};

export default ProtectedRoute;
