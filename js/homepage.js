import './preferences.js';

const byId = (id) => document.getElementById(id);
const dialog = byId('memberDialog');
const form = byId('memberForm');
const mainStatus = byId('memberStatus');
const formError = byId('memberError');
const signIn = byId('signIn');
const signUp = byId('signUp');
const signOut = byId('signOut');
const submit = byId('memberSubmit');
const password = byId('memberPassword');
let creating = false;

const redirectTo = new URL('./', location.href).href;
let membership;
function loadMembership() {
  membership ??= import('./member-auth.js?v=supabase1').then(({ auth }) => {
    auth.onAuthStateChange((event, session) => {
      signIn.hidden = signUp.hidden = Boolean(session);
      signOut.hidden = byId('homeSettings').hidden = !session;
      if (session) mainStatus.textContent = 'Signed in. You’re ready to play.';
      else if (event === 'SIGNED_OUT') mainStatus.textContent = 'Signed out.';
    });
    return { auth };
  }).catch(error => {
    membership = undefined;
    throw error;
  });
  return membership;
}

const errors = {
  invalid_credentials: 'That email and password didn’t match.',
  email_address_not_authorized: 'This email can’t receive verification yet. Public email delivery still needs to be set up.',
  email_not_confirmed: 'Open the confirmation email before signing in.',
  weak_password: 'Choose a stronger password.',
  over_email_send_rate_limit: 'Too many emails were requested. Try again later.',
  over_request_rate_limit: 'Too many attempts. Try again in a moment.',
};
function message(error) {
  return errors[error.code] || 'Sign-in is temporarily unavailable. Try again in a moment.';
}

function openMemberDialog(signingUp) {
  creating = signingUp;
  form.reset();
  formError.textContent = '';
  byId('memberNameField').hidden = !creating;
  byId('memberName').required = creating;
  password.autocomplete = creating ? 'new-password' : 'current-password';
  password.minLength = creating ? 6 : 0;
  byId('memberPasswordHint').hidden = !creating;
  byId('memberTitle').textContent = submit.textContent = creating ? 'Sign up' : 'Sign in';
  dialog.showModal();
}

signIn.addEventListener('click', () => openMemberDialog(false));
signUp.addEventListener('click', () => openMemberDialog(true));
byId('closeDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('cancel', (event) => {
  if (submit.disabled) event.preventDefault();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.textContent = '';
  submit.disabled = byId('closeDialog').disabled = true;
  try {
    const { auth } = await loadMembership();
    const email = byId('memberEmail').value.trim();
    let needsVerification = false;
    if (creating) {
      const name = byId('memberName').value.trim();
      if (!name) {
        formError.textContent = 'Enter your player name.';
        return;
      }
      const { data, error } = await auth.signUp({
        email,
        password: password.value,
        options: { emailRedirectTo: redirectTo, data: { display_name: name } },
      });
      if (error) throw error;
      needsVerification = !data.session;
    } else {
      const { error } = await auth.signInWithPassword({ email, password: password.value });
      if (error) throw error;
    }
    form.reset();
    dialog.close();
    if (needsVerification) byId('verifyEmail').showModal();
  } catch (error) {
    formError.textContent = message(error);
  } finally {
    submit.disabled = byId('closeDialog').disabled = false;
  }
});

signOut.addEventListener('click', async () => {
  signOut.disabled = true;
  try {
    const { auth } = await loadMembership();
    const { error } = await auth.signOut({ scope: 'local' });
    if (error) throw error;
    mainStatus.textContent = 'Signed out.';
  } catch {
    mainStatus.textContent = 'Couldn’t sign out. Please try again.';
  } finally {
    signOut.disabled = false;
  }
});

loadMembership().catch(() => {});

const video = byId('gameplay');
function resumeBackground() {
  if (!document.hidden && video.paused) video.play().catch(() => {});
}
document.addEventListener('visibilitychange', resumeBackground);
window.addEventListener('pageshow', resumeBackground);
window.addEventListener('click', resumeBackground);
resumeBackground();
