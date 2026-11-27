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
