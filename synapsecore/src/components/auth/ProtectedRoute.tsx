import React from 'react';
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
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login page, but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific permission is required, check if user has it
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Redirect to unauthorized page
    return <Navigate to="/unauthorized" state={{ requiredPermission }} replace />;
  }

  // User is authenticated and has required permissions, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
