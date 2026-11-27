const byId = (id) => document.getElementById(id);
const dialog = byId('memberDialog');
const form = byId('memberForm');
const mainStatus = byId('memberStatus');
const formError = byId('memberError');
const signIn = byId('signIn');
const signUp = byId('signUp');
const googleSignIn = byId('googleSignIn');
const signOut = byId('signOut');
const submit = byId('memberSubmit');
const password = byId('memberPassword');
let creating = false;

const sdkUrl = 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
let membership;
function loadMembership() {
  membership ??= Promise.all([import('./member-auth.js'), import(sdkUrl)])
    .then(([{ auth }, sdk]) => {
      sdk.onAuthStateChanged(auth, (user) => {
        signIn.hidden = signUp.hidden = googleSignIn.hidden = Boolean(user);
        signOut.hidden = !user;
        mainStatus.textContent = user ? 'Signed in. You’re ready to play.' : '';
      });
      return { auth, sdk };
    });
  return membership;
}

const errors = {
  'auth/invalid-credential': 'That email and password didn’t match.',
  'auth/email-already-in-use': 'That email already has an account. Try signing in.',
  'auth/weak-password': 'Choose a password with at least six characters.',
  'auth/operation-not-allowed': 'This sign-in method hasn’t been enabled in Firebase.',
  'auth/unauthorized-domain': 'This site address hasn’t been approved in Firebase for Google sign-in.',
  'auth/popup-blocked': 'Allow pop-ups for this site and try again.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
  'auth/account-exists-with-different-credential': 'This email already uses a different sign-in method.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment before trying again.',
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
    const { auth, sdk } = await loadMembership();
    const email = byId('memberEmail').value.trim();
    if (creating) {
      const name = byId('memberName').value.trim();
      if (!name) {
        formError.textContent = 'Enter your player name.';
        return;
      }
      const { user } = await sdk.createUserWithEmailAndPassword(auth, email, password.value);
      await sdk.updateProfile(user, { displayName: name }).catch(() => {
        mainStatus.textContent = 'Your account is ready. You can set your player name in My Player.';
      });
    } else {
      await sdk.signInWithEmailAndPassword(auth, email, password.value);
    }
    form.reset();
    dialog.close();
  } catch (error) {
    formError.textContent = message(error);
  } finally {
    submit.disabled = byId('closeDialog').disabled = false;
  }
});

googleSignIn.addEventListener('click', async () => {
  googleSignIn.disabled = true;
  mainStatus.textContent = '';
  try {
    const { auth, sdk } = await loadMembership();
    await sdk.signInWithPopup(auth, new sdk.GoogleAuthProvider());
  } catch (error) {
    mainStatus.textContent = message(error);
  } finally {
    googleSignIn.disabled = false;
  }
});

signOut.addEventListener('click', async () => {
  signOut.disabled = true;
  try {
    const { auth, sdk } = await loadMembership();
    await sdk.signOut(auth);
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
