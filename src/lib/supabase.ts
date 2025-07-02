import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a flag to track if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a mock client for when Supabase is not configured
const createMockSupabaseClient = () => {
  const mockError = new Error(
    'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );

  return {
    auth: {
      signInWithOAuth: async () => ({ data: null, error: mockError }),
      signOut: async () => ({ data: null, error: mockError }),
      getSession: async () => ({ data: { session: null }, error: mockError }),
      onAuthStateChange: () => ({
        data: { subscription: null },
        error: mockError,
      }),
    },
    from: () => ({
      select: () => ({ data: null, error: mockError }),
      insert: () => ({ data: null, error: mockError }),
      update: () => ({ data: null, error: mockError }),
      delete: () => ({ data: null, error: mockError }),
      upsert: () => ({ data: null, error: mockError }),
      eq: () => ({ data: null, error: mockError }),
    }),
  };
};

// Export the client - either real or mock
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : (createMockSupabaseClient() as never);

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string;
          user_id: string;
          english: string;
          vietnamese: string;
          example: string | null;
          phonetic: string | null;
          created_at: string;
          updated_at: string;
          status: 'new' | 'learning' | 'learned';
          interval: number;
          step_index: number;
          next_review: string;
          lapses: number;
          reps: number;
          last_review: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          english: string;
          vietnamese: string;
          example?: string | null;
          phonetic?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: 'new' | 'learning' | 'learned';
          interval?: number;
          step_index?: number;
          next_review?: string;
          lapses?: number;
          reps?: number;
          last_review?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          english?: string;
          vietnamese?: string;
          example?: string | null;
          phonetic?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: 'new' | 'learning' | 'learned';
          interval?: number;
          step_index?: number;
          next_review?: string;
          lapses?: number;
          reps?: number;
          last_review?: string | null;
        };
      };
    };
  };
};
