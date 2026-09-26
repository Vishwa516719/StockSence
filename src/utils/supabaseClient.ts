declare global {
  interface Window {
    supabase: any;
  }
}

const SUPABASE_URL = 'https://yqeyzuwcillwfysdrdte.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9noWPdhG_U72eoSCQCaSew_g6tLIElJ';

export const getSupabaseClient = () => {
  if (window.supabase) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return null;
};

export const supabase = getSupabaseClient();
