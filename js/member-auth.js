import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm';

const projectUrl = 'https://bsslcrkfldoapjlzpxig.supabase.co';
const publishableKey = 'sb_publishable_I_T71j3hS2e9kZQ7jbLgfQ_RNuCXyQ5';

export const client = createClient(projectUrl, publishableKey, {
  auth: { flowType: 'pkce' },
});
export const auth = client.auth;

async function callPlayerService(input, token) {
  const response = await fetch(projectUrl + '/functions/v1/register-player', {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.message || 'Account service unavailable'), { publicMessage: body.message, status: response.status });
  }
  return response.json();
}

export function registerPlayer(username, password) {
  return callPlayerService({ username, password });
}

export async function playerSaveRequest(operation, userId, changes) {
  const { data, error } = await auth.getSession();
  if (error) throw error;
  if (data.session?.user.id !== userId) throw Error('Sign in again to change your save.');
  return callPlayerService({ operation, ...changes }, data.session.access_token);
}

export async function signInPlayer(username, password) {
  const email = username.toLowerCase() + '@players.prestige.invalid';
  const { error } = await auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function changePassword(currentPassword, password) {
  const { data, error } = await auth.getUser();
  if (error) throw error;
  if (!data.user?.email) throw Object.assign(new Error('Sign-in required'), { code: 'session_not_found' });

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

export async function developerRequest(action, fields) {
  const {data,error}=await auth.getSession();
  if(error)throw error;
  if(!data.session)throw Error('Sign in first.');
  return callPlayerService({...fields,operation:'developer-'+action},data.session.access_token);
}
