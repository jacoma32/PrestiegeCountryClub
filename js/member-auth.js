import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm';

const projectUrl = 'https://bsslcrkfldoapjlzpxig.supabase.co';
const publishableKey = 'sb_publishable_I_T71j3hS2e9kZQ7jbLgfQ_RNuCXyQ5';

export const auth = createClient(projectUrl, publishableKey, {
  auth: { flowType: 'pkce' },
}).auth;

export async function googleEnabled() {
  const response = await fetch(projectUrl + '/auth/v1/settings', {
    headers: { apikey: publishableKey },
  });
  if (!response.ok) throw new Error('Could not check sign-in settings.');
  const settings = await response.json();
  return settings.external.google === true;
}

export async function changePassword(currentPassword, password) {
  const { data, error } = await auth.getUser();
  if (error) throw error;
  if (!data.user?.email) throw Object.assign(new Error('Email sign-in required'), { code: 'session_not_found' });

  // Verify in a short-lived session so a failed attempt leaves the game session intact.
  const verifier = createClient(projectUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).auth;
  const verified = await verifier.signInWithPassword({ email: data.user.email, password: currentPassword });
  if (verified.error) throw verified.error;
  try {
    if (verified.data.user?.id !== data.user.id) {
      throw Object.assign(new Error('Account changed'), { code: 'session_not_found' });
    }
    const update = await verifier.updateUser({ password, current_password: currentPassword });
    if (update.error) throw update.error;
  } finally {
    await verifier.signOut({ scope: 'local' }).catch(() => {});
  }
}
