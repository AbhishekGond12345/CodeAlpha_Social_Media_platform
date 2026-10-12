import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const options = { auth: { autoRefreshToken: false, persistSession: false } };

/** Admin client: creates auth users and writes the profiles table. Server only. */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);

/** Fresh anon client per sign-in so sessions never leak between requests. */
export const newAnonClient = () => createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, options);
