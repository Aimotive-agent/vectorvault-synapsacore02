import { User } from '../types/auth';

// Auth token key in localStorage - using the same keys as the main src auth service
const AUTH_TOKEN_KEY = 'synapsecore_auth_token';
const USER_DATA_KEY = 'synapsecore_user_data';

/**
 * Service for handling authentication across SynapseCore and VectorVault
 */
export const authService = {
  /**
   * Login user and store authentication data
   */
  login: async (email: string, password: string): Promise<User> => {
    try {
      // In a real implementation, this would be an API call to a backend service
      // For now, we'll simulate a successful login with mock data
      const mockUser: User = {
        id: 'user-1',
        email,
        name: email.split('@')[0],
        role: 'user',
        permissions: ['read', 'write', 'vector_vault_access']
      };
      
      // Store auth token and user data
      const mockToken = `mock-token-${Date.now()}`;
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));
      
      return mockUser;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Authentication failed');
    }
  },
  
  /**
   * Register a new user
   */
  register: async (email: string, password: string, name: string): Promise<User> => {
    try {
      // In a real implementation, this would be an API call to a backend service
      // For now, we'll simulate a successful registration with mock data
      const mockUser: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        role: 'user',
        permissions: ['read', 'write', 'vector_vault_access']
      };
      
      // Store auth token and user data
      const mockToken = `mock-token-${Date.now()}`;
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));
      
      return mockUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed');
    }
  },
  
  /**
   * Logout user and clear authentication data
   */
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },
  
  /**
   * Get current user data
   */
  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  },
  
  /**
   * Get authentication token
   */
  getToken: (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  
  /**
   * Check if user has specific permission
   */
  hasPermission: (permission: string): boolean => {
    const user = authService.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  },
  
  /**
   * Check if user has access to VectorVault
   */
  hasVectorVaultAccess: (): boolean => {
    return authService.hasPermission('vector_vault_access');
  }
};

export default authService;
