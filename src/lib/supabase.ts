import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Round = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type Vote = {
  id: string;
  round_id: string;
  verse_number: number;
  voter_fingerprint: string;
  created_at: string;
};
