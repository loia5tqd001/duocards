import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
    user: null,
    session: null,
    isLoading: false,
    isInitialized: false,

    signInWithGoogle: async () => {
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured. Authentication unavailable.');
        return;
      }
      try {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    signInWithFacebook: async () => {
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured. Authentication unavailable.');
        return;
      }
      try {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      } catch (error) {
        console.error('Error signing in with Facebook:', error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    signOut: async () => {
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured. Authentication unavailable.');
        return;
      }
      try {
        set({ isLoading: true });
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error('Error signing out:', error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    initialize: async () => {
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured. Authentication unavailable.');
        set({ isInitialized: true });
        return;
      }
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        set({
          session,
          user: session?.user ?? null,
          isInitialized: true,
        });

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
          set({
            session,
            user: session?.user ?? null,
          });
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        set({ isInitialized: true });
      }
    },
  }))
);
