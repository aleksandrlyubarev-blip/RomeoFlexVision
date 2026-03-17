import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && supabaseUrl !== 'https://your-project.supabase.co' &&
  Boolean(supabaseAnonKey) && supabaseAnonKey !== 'your-anon-key';

// Always create the client — even with placeholder values for dev mode.
// Calls will fail gracefully and AuthContext falls back to demo mode.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
);
