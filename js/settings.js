import { readPreferences, savePreferences } from './preferences.js';

const byId = id => document.getElementById(id);
const form = byId('passwordForm');
const accountStatus = byId('accountStatus');
const passwordStatus = byId('passwordStatus');
const sound = byId('soundPreference');
const textSize = byId('textSize');
const submit = form.querySelector('button');
const preferences = readPreferences();
sound.checked = preferences.sound;
textSize.value = preferences.textSize;

function save(changes) {
  byId('preferencesStatus').textContent = savePreferences(changes)
    ? 'Settings saved.'
    : 'This browser couldn’t save your settings.';
}
sound.addEventListener('change', () => save({ sound: sound.checked }));
textSize.addEventListener('change', () => save({ textSize: textSize.value }));

if (new URLSearchParams(location.search).get('from') === 'clubhouse') {
  const back = byId('backLink');
  back.href = './game.html';
  back.textContent = '← Clubhouse';
}

const passwordErrors = {
  invalid_credentials: 'The current password is incorrect.',
  current_password_mismatch: 'The current password is incorrect.',
  same_password: 'Choose a password different from your current one.',
  weak_password: 'Choose a stronger password with at least 6 characters.',
  over_request_rate_limit: 'Too many attempts. Try again in a moment.',
  session_not_found: 'Sign in again to change your password.',
};

import('./member-auth.js?v=settings1').then(({ auth, changePassword }) => {
  auth.onAuthStateChange((_event, session) => {
    form.hidden = !session?.user.email;
    accountStatus.hidden = !form.hidden;
    accountStatus.textContent = 'Sign in with email on the homepage to change your password.';
    if (form.hidden) form.reset();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || form.hidden) return;
    const fields = new FormData(form);
    const currentPassword = fields.get('currentPassword');
    const newPassword = fields.get('newPassword');
    if (newPassword !== fields.get('confirmPassword')) {
      passwordStatus.textContent = 'The new passwords don’t match.';
      form.elements.confirmPassword.focus();
      return;
    }
    submit.disabled = true;
    passwordStatus.textContent = '';
    try {
      await changePassword(currentPassword, newPassword);
      form.reset();
      passwordStatus.textContent = 'Password changed.';
    } catch (error) {
      form.elements.currentPassword.value = '';
      passwordStatus.textContent = passwordErrors[error.code]
        || 'Couldn’t change your password. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
}).catch(() => {
  accountStatus.textContent = 'Sign-in is temporarily unavailable. Try again later.';
});
