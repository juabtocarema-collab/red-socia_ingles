import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hrekmevefypsarsmgmkp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_PQTQ1ex6x5hyc9lZW7_wQw_MkYmcICf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export default supabase;
