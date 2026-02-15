import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  // We don't want to throw error during build time, so maybe just log warning or ensure envs are present
  // But for runtime it's better to throw.
  // Although checking for undefined is safer.
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
