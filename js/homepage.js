import './preferences.js';

const byId = (id) => document.getElementById(id);
const dialog = byId('memberDialog');
const form = byId('memberForm');
const formError = byId('memberError');
const signIn = byId('signIn');
const signUp = byId('signUp');
const signOut = byId('signOut');
const submit = byId('memberSubmit');
const password = byId('memberPassword');
let creating = false;

const party = new URLSearchParams(location.search).get('party');
const validParty = /^[A-Z0-9]{6}$/i.test(party || '');
if (validParty) byId('welcomeStatus').textContent = 'Sign in to join your friend’s round.';
else if (new URLSearchParams(location.search).has('play')) {
  byId('welcomeStatus').textContent = 'Sign in to play golf.';
}

let membership;
function loadMembership() {
  membership ??= import('./member-auth.js?v=username1').then(({ auth, signInPlayer, registerPlayer }) => {
    auth.onAuthStateChange((event, session) => {
      const signedIn = Boolean(session?.user?.user_metadata?.username);
      byId('welcomeHome').hidden = signedIn;
      byId('memberHeader').hidden = byId('memberHome').hidden = signOut.hidden = !signedIn;
      if (signedIn && validParty) {
        location.replace('./game.html?party=' + encodeURIComponent(party));
      } else if (event === 'SIGNED_OUT') {
        byId('welcomeStatus').textContent = 'Signed out.';
      }
    });
    return { auth, signInPlayer, registerPlayer };
  }).catch(error => {
    membership = undefined;
    throw error;
  });
  return membership;
}

const errors = {
  invalid_credentials: 'That username and password didn’t match.',
  over_request_rate_limit: 'Too many attempts. Try again in a moment.',
};
function message(error) {
  return errors[error.code] || error.publicMessage || 'Sign-in is temporarily unavailable. Try again in a moment.';
}

function openMemberDialog(signingUp) {
  creating = signingUp;
  form.reset();
  formError.textContent = '';
  byId('usernameHint').hidden = !creating;
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
    const { signInPlayer, registerPlayer } = await loadMembership();
    const username = byId('memberName').value.trim();
    if (creating) await registerPlayer(username, password.value);
    await signInPlayer(username, password.value);
    form.reset();
    dialog.close();
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
  } catch {
    byId('memberStatus').textContent = 'Couldn’t sign out. Please try again.';
  } finally {
    signOut.disabled = false;
  }
});


loadMembership().catch(() => {});
