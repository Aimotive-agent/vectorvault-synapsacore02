import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials, RegistrationData } from '../types/auth';
import { authService } from '../services/authService';

// Define the shape of the context
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasVectorVaultAccess: () => boolean;
}

// Create the context with a default empty implementation to avoid the 'must be used within provider' error
const defaultContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  login: async () => { throw new Error('AuthContext not initialized'); },
  register: async () => { throw new Error('AuthContext not initialized'); },
  logout: () => {},
  hasPermission: () => false,
  hasVectorVaultAccess: () => false
};

const AuthContext = createContext<AuthContextType>(defaultContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getCurrentUser();
        
        setState({
          isAuthenticated,
          user,
          loading: false,
          error: null
        });
      } catch (error) {
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'Failed to restore authentication state'
        });
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const user = await authService.login(credentials.email, credentials.password);
      setState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      throw error;
    }
  };

  // Register function
  const register = async (data: RegistrationData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const user = await authService.register(data.email, data.password, data.name);
      setState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  // Check if user has access to VectorVault
  const hasVectorVaultAccess = (): boolean => {
    return authService.hasVectorVaultAccess();
  };

  // Provide the context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    hasPermission,
    hasVectorVaultAccess
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  return context; // Will return the default context if outside provider
};

export default AuthContext;
