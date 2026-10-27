import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hrekmevefypsarsmgmkp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_PQTQ1ex6x5hyc9lZW7_wQw_MkYmcICf';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SECRET_KEY.includes('•') 
  ? process.env.SUPABASE_SECRET_KEY 
  : null;

// Standard Supabase client (Client-side / Publishable operations)
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Admin client (Uses secret key if provided and unmasked, otherwise falls back to publishable key)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default supabase;
