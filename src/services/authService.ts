import { supabase } from '../integrations/supabase/client';
import { User } from '../types/auth';

// Mirror of the current app user in localStorage (kept in sync with the Supabase session)
const USER_DATA_KEY = 'synapsecore_user_data';

// Every signed-in user gets the base permissions, including VectorVault access.
const DEFAULT_PERMISSIONS = ['read', 'write', 'vector_vault_access'];

const toAppUser = (sbUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User => {
  const meta = sbUser.user_metadata ?? {};
  const email = sbUser.email ?? '';
  return {
    id: sbUser.id,
    email,
    name: (meta.display_name as string) || (meta.name as string) || email.split('@')[0],
    role: 'user',
    permissions: [...DEFAULT_PERMISSIONS],
  };
};

const remember = (user: User) => localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
const forget = () => localStorage.removeItem(USER_DATA_KEY);

const friendlyError = (message: string): string => {
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/already (registered|exists)/i.test(message)) return 'An account with this email already exists — please sign in.';
  return message || 'Authentication failed';
};

/**
 * Authentication for SynapseCore + VectorVault, backed by Supabase auth
 * (self-hosted on the homelab; signups are auto-confirmed).
 */
export const authService = {
  /**
   * Login user and store authentication data
   */
  login: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyError(error.message));

    const user = toAppUser(data.user);
    remember(user);
    return user;
  },

  /**
   * Register a new user. Signups are auto-confirmed on our stack,
   * so the user is signed in immediately.
   */
  register: async (email: string, password: string, name: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });

    // GoTrue reports duplicate signups as an empty identities array (or an error).
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      throw new Error('An account with this email already exists — please sign in.');
    }
    if (error) throw new Error(friendlyError(error.message));

    if (!data.session || !data.user) {
      throw new Error('Account created. Please check your email to confirm, then sign in.');
    }

    const user = toAppUser(data.user);
    remember(user);
    return user;
  },

  /**
   * Logout user and clear authentication data
   */
  logout: () => {
    forget();
    void supabase.auth.signOut();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(USER_DATA_KEY);
  },

  /**
   * Get current user data
   */
  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Restore the session from Supabase after a reload.
   * Returns the app user, or null when signed out.
   */
  restoreSession: async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      forget();
      return null;
    }
    const user = toAppUser(data.session.user);
    remember(user);
    return user;
  },

  /**
   * Subscribe to Supabase auth state changes (sign-in, sign-out, token refresh).
   */
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ? toAppUser(session.user) : null;
      if (user) remember(user);
      else forget();
      callback(user);
    });
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
