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
 * 
 * 6. In your Supabase Dashboard > SQL Editor, run this script to create the applications table:
 *    CREATE TABLE IF NOT EXISTS public.applications (
 *      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *      user_id TEXT,
 *      role_type TEXT NOT NULL CHECK (role_type IN ('offer_owner', 'candidate')),
 *      full_name TEXT NOT NULL,
 *      email TEXT NOT NULL,
 *      phone TEXT,
 *      details JSONB NOT NULL DEFAULT '{}'::jsonb,
 *      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'archived')),
 *      notes TEXT,
 *      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
 *      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 *    );
 *    ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
 *    DROP POLICY IF EXISTS "Allow public insert" ON public.applications;
 *    DROP POLICY IF EXISTS "Allow all read" ON public.applications;
 *    DROP POLICY IF EXISTS "Allow all update" ON public.applications;
 *    DROP POLICY IF EXISTS "Allow all delete" ON public.applications;
 *    CREATE POLICY "Allow public insert" ON public.applications FOR INSERT WITH CHECK (true);
 *    CREATE POLICY "Allow all read" ON public.applications FOR SELECT USING (true);
 *    CREATE POLICY "Allow all update" ON public.applications FOR UPDATE USING (true) WITH CHECK (true);
 *    CREATE POLICY "Allow all delete" ON public.applications FOR DELETE USING (true);
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
