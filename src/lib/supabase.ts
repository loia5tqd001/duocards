import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

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
          status: "new" | "learning" | "learned";
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
          status?: "new" | "learning" | "learned";
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
          status?: "new" | "learning" | "learned";
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
