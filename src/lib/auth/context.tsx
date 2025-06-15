'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes with improved handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug(
        '🔐 Auth event:',
        event,
        session?.user?.id?.slice(-6) || 'no-user'
      );

      // Update state reactively without page reload
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events appropriately
      switch (event) {
        case 'SIGNED_IN':
          console.debug('✅ User signed in successfully');
          // State update is sufficient, no reload needed
          break;

        case 'SIGNED_OUT':
          console.debug('👋 User signed out');
          // Clear any cached data but don't reload - let router handle redirect
          if (typeof window !== 'undefined') {
            // Clear sensitive data from storage
            sessionStorage.removeItem('current-conversation');
            localStorage.removeItem('chat-initialized');
          }
          break;

        case 'TOKEN_REFRESHED':
          console.debug('🔄 Token refreshed successfully');
          // Silent refresh, no action needed
          break;

        case 'USER_UPDATED':
          console.debug('👤 User profile updated');
          // State already updated above
          break;

        default:
          console.debug(`🔐 Auth event "${event}" handled`);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange handler will manage the state update
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithTwitter = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    signInWithGoogle,
    signInWithDiscord,
    signInWithTwitter,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
