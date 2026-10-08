import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthResponse {
  error?: string;
  confirmationSent?: boolean;
}

// Default administrative emails
const DEFAULT_ADMIN_EMAILS = [
  'jc.dev.uk@gmail.com',
  'admin@vox-direct.com',
  'team@vox-direct.com',
  'director@vox-direct.com',
];

/**
 * Resolves all configured admin emails from environment variables (e.g., VITE_ADMIN_EMAILS / VITE_ADMIN_EMAIL)
 * plus the default list.
 *
 * In Vercel, set:
 *   VITE_ADMIN_EMAILS="jc.dev.uk@gmail.com,partner@example.com"
 *   (or comma-separated emails)
 */
export const getAdminEmails = (): string[] => {
  const envEmails: string[] = [];
  try {
    const raw =
      (typeof import.meta !== 'undefined' &&
        ((import.meta as any).env?.VITE_ADMIN_EMAILS ||
         (import.meta as any).env?.VITE_ADMIN_EMAIL)) ||
      '';
    if (raw && typeof raw === 'string') {
      raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .forEach((e) => {
          if (!envEmails.includes(e)) envEmails.push(e);
        });
    }
  } catch {
    // ignore
  }

  const combined = [...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase())];
  for (const email of envEmails) {
    if (!combined.includes(email)) {
      combined.push(email);
    }
  }
  return combined;
};

export const ADMIN_EMAILS = getAdminEmails();

export const checkIsAdmin = (user: AuthUser | null): boolean => {
  if (!user) return false;
  // 1. Role explicitly marked as admin in profile or Supabase user_metadata
  if (user.role === 'admin' || user.isAdmin === true) return true;
  // 2. Email matches configured admin list (including VITE_ADMIN_EMAILS)
  const allowed = getAdminEmails();
  const userEmail = user.email?.trim().toLowerCase();
  return Boolean(userEmail && allowed.includes(userEmail));
};

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, role: UserRole, fullName?: string) => Promise<AuthResponse>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<AuthResponse>;
  signInAsAdminDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'vox_direct_auth_session';
const LOCAL_STORAGE_USERS_KEY = 'vox_direct_local_users_db';

interface StoredLocalUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  fullName?: string;
  createdAt: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from Supabase or localStorage
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Fetch current session from Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase session load error:', error);
          }

          if (session?.user && isMounted) {
            const role = (session.user.user_metadata?.role as UserRole) || 'seeker';
            const fullName = (session.user.user_metadata?.full_name as string) || '';
            const mappedUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              role,
              fullName,
              createdAt: session.user.created_at,
            };
            setUser(mappedUser);
            try {
              localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mappedUser));
            } catch {
              // ignore storage error
            }
          } else {
            // Check fallback session in localStorage if any
            const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
            if (savedSession && isMounted) {
              try {
                setUser(JSON.parse(savedSession));
              } catch {
                localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
              }
            }
          }

          // 2. Listen to Supabase Auth state changes
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
              if (!isMounted) return;
              if (session?.user) {
                const role = (session.user.user_metadata?.role as UserRole) || 'seeker';
                const fullName = (session.user.user_metadata?.full_name as string) || '';
                const u: AuthUser = {
                  id: session.user.id,
                  email: session.user.email || '',
                  role,
                  fullName,
                  createdAt: session.user.created_at,
                };
                setUser(u);
                localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(u));
              } else {
                setUser(null);
                localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
              }
            }
          );

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          // Fallback / Lightweight Client Auth persistence
          const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (savedSession && isMounted) {
            try {
              setUser(JSON.parse(savedSession));
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing authentication:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Helper to fetch local users store for lightweight mode
   */
  const getLocalUsers = (): StoredLocalUser[] => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalUsers = (users: StoredLocalUser[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Could not save local user database:', e);
    }
  };

  /**
   * Sign In with Email & Password
   */
  const signInWithPassword = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { error: 'Please enter your email address.' };
    }
    if (!password) {
      return { error: 'Please enter your password.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return { error: error.message };
        }

        if (data.user) {
          const role = (data.user.user_metadata?.role as UserRole) || 'seeker';
          const fullName = (data.user.user_metadata?.full_name as string) || '';
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            role,
            fullName,
            createdAt: data.user.created_at,
          };
          setUser(authUser);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
          return {};
        }
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Authentication request failed.' };
      }
    }

    // Lightweight client authentication fallback
    const users = getLocalUsers();
    const existing = users.find((u) => u.email === cleanEmail);

    if (!existing) {
      // For immediate convenience during testing, if user doesn't exist,
      // create them automatically or require signup.
      // We will check password length:
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long.' };
      }
      return {
        error: 'Invalid email or password. Please check your credentials or create a new account.',
      };
    }

    if (existing.passwordHash !== password) {
      return { error: 'Invalid password. Please check your credentials.' };
    }

    const authUser: AuthUser = {
      id: existing.id,
      email: existing.email,
      role: existing.role,
      fullName: existing.fullName,
      createdAt: existing.createdAt,
    };

    setUser(authUser);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
    return {};
  };

  /**
   * Sign Up with Role Selection
   */
  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    fullName?: string
  ): Promise<AuthResponse> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName?.trim() || '';

    if (!cleanEmail) {
      return { error: 'Please enter your email address.' };
    }
    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              role,
              full_name: cleanName,
            },
          },
        });

        if (error) {
          return { error: error.message };
        }

        // If email confirmation is enabled in Supabase, data.session may be null
        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            role,
            fullName: cleanName,
            createdAt: data.user.created_at,
          };
          setUser(authUser);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));

          const needsConfirmation = !data.session;
          return { confirmationSent: needsConfirmation };
        }
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Sign up request failed.' };
      }
    }

    // Lightweight client authentication fallback
    const users = getLocalUsers();
    if (users.some((u) => u.email === cleanEmail)) {
      return { error: 'An account with this email already exists. Please sign in instead.' };
    }

    const newUser: StoredLocalUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      passwordHash: password,
      role,
      fullName: cleanName,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveLocalUsers(users);

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
      createdAt: newUser.createdAt,
    };

    setUser(authUser);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
    return {};
  };

  /**
   * Sign In via Magic Link (OTP)
   */
  const signInWithMagicLink = async (email: string, redirectTo?: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { error: 'Please enter your email address.' };
    }

    const targetUrl = redirectTo || (typeof window !== 'undefined' ? window.location.origin : '');

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: targetUrl,
          },
        });

        if (error) {
          return { error: error.message };
        }

        return { confirmationSent: true };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Magic link dispatch failed.' };
      }
    }

    // Lightweight fallback simulation:
    // Create or find local user and establish session
    const users = getLocalUsers();
    let existing = users.find((u) => u.email === cleanEmail);

    if (!existing) {
      existing = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: cleanEmail,
        passwordHash: 'magic-link-auth',
        role: 'seeker',
        createdAt: new Date().toISOString(),
      };
      users.push(existing);
      saveLocalUsers(users);
    }

    // Instantly log them in for testing or return magic link confirmation
    const authUser: AuthUser = {
      id: existing.id,
      email: existing.email,
      role: existing.role,
      fullName: existing.fullName,
      createdAt: existing.createdAt,
    };

    setUser(authUser);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));

    return { confirmationSent: true };
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err);
      }
    }

    setUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  /**
   * Update User Profile (e.g., name or role change)
   */
  const updateUserProfile = (data: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updated));

      const users = getLocalUsers();
      const idx = users.findIndex((u) => u.id === user.id || u.email === user.email);
      if (idx !== -1) {
        if (data.role) users[idx].role = data.role;
        if (data.fullName !== undefined) users[idx].fullName = data.fullName;
        saveLocalUsers(users);
      }
    } catch (e) {
      console.warn('Failed to update local user profile:', e);
    }
  };

  const isAdmin = checkIsAdmin(user);

  /**
   * Demo Sign In as Admin for instant portal testing
   */
  const signInAsAdminDemo = async () => {
    const adminUser: AuthUser = {
      id: 'usr_admin_verified',
      email: 'jc.dev.uk@gmail.com',
      fullName: 'Vox Direct Operations',
      role: 'admin',
      isAdmin: true,
      createdAt: new Date().toISOString(),
    };
    setUser(adminUser);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(adminUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        isSupabaseConfigured,
        signInWithPassword,
        signUp,
        signInWithMagicLink,
        signInAsAdminDemo,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
