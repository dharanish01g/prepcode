import { createClient } from "@supabase/supabase-js";

// The publishable keys are public by design: they ship in every copy of the
// app, and row level security decides what they can read or write.

/** prepcode's project, which the content team manages Practice in. */
export const supabase = createClient(
  "https://gjlynpdgovgyyklamtds.supabase.co",
  "sb_publishable_w2bnVW8VQGr5BbV88Xdbcg_IzYGzFVX",
  // Students sign in with GitHub, not Supabase Auth.
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/** The old prepcode project, only for Jobs until its table moves to the main project. */
export const jobsSupabase = createClient(
  "https://osprwlsbdioyejpbwcmj.supabase.co",
  "sb_publishable_gIBQhNZo4QFEdhQxdSgoYg_GmjWgIDP",
  { auth: { persistSession: false, autoRefreshToken: false } },
);
