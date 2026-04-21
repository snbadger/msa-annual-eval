// Supabase client initialization and config.
// This file is loaded by every page.
// The anon key is a public, throw-away key; RLS is what protects data.
//
// If you fork/clone this for another facility, update SUPABASE_URL and
// SUPABASE_ANON_KEY below. Do NOT put the service_role key here.

const SUPABASE_URL = 'https://pmnudshutxwidxdtouqj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wzX5nLx18cfErNTRPO671w_sH4ED7ET';

// Load the official Supabase JS client from CDN (ES module).
// Use a pinned minor version for reproducibility.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'msa-eval-auth',
    // PKCE flow — the email link only works combined with a code_verifier
    // stored in this browser's localStorage. Prevents email-prefetcher
    // scanners from consuming the one-time token before the user clicks.
    flowType: 'pkce'
  },
  db: { schema: 'hr_eval' }
});

// ---------------------------------------------------------------
// RPC helpers — thin typed-ish wrappers around the Postgres RPCs
// ---------------------------------------------------------------

export async function lookupCycle(token) {
  const { data, error } = await sb.rpc('lookup_cycle', { p_token: token });
  if (error) throw error;
  return data;
}

export async function submitFeedback(payload) {
  const { data, error } = await sb.rpc('submit_feedback', payload);
  if (error) throw error;
  return data;
}

export async function createCycle({ employeeId, periodStart, periodEnd, reviewType = 'annual', dueAt }) {
  const { data, error } = await sb.rpc('create_cycle', {
    p_employee_id: employeeId,
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_review_type: reviewType,
    p_feedback_due_at: dueAt
  });
  if (error) throw error;
  return data?.[0]; // { cycle_id, share_token }
}

export async function generatePackage(cycleId) {
  const { data, error } = await sb.rpc('generate_package', { p_review_cycle_id: cycleId });
  if (error) throw error;
  return data; // markdown string
}

// ---------------------------------------------------------------
// Auth helpers for manager side
// ---------------------------------------------------------------

export async function currentSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function sendMagicLink(email, redirectTo) {
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || (window.location.origin + '/admin.html'),
      shouldCreateUser: false
    }
  });
  if (error) throw error;
}

export async function verifyOtpCode(email, token) {
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await sb.auth.signOut();
}

export async function requireManager() {
  const session = await currentSession();
  if (!session) {
    window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
    return null;
  }
  return session;
}
