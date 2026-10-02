import { createClient } from "@supabase/supabase-js";

// The publishable key is public by design: it ships in every copy of the app,
// and row level security decides what it can read or write.
const SUPABASE_URL = "https://osprwlsbdioyejpbwcmj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gIBQhNZo4QFEdhQxdSgoYg_GmjWgIDP";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  // Students sign in with GitHub, not Supabase Auth.
  auth: { persistSession: false, autoRefreshToken: false },
});
