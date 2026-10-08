/**
 * Supabase Client Configuration for Vox Direct
 * 
 * HOW TO CONFIGURE SUPABASE AUTH:
 * 1. Create a free project at https://supabase.com
 * 2. Go to Project Settings > API
 * 3. Copy "Project URL" and "anon public" key
 * 4. Add them to your environment variables (.env / Vercel Environment Variables):
 *      VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
 *      VITE_SUPABASE_ANON_KEY="your-anon-key-here"
 *    (or SUPABASE_URL and SUPABASE_ANON_KEY)
 * 5. In your Supabase Dashboard > Authentication:
 *    - Enable Email Provider
 *    - Enable Magic Link (Email OTP)
 *    - Set Site URL to your domain (e.g. https://vox-direct.com) and redirect URLs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite or fallback env
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  '';

// Check if valid credentials are provided (ignoring placeholder values)
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null;
