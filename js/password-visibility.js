const eye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/><path class="eye-slash" d="m3 3 18 18" style="display:none"/></svg>';

for (const input of document.querySelectorAll('input[type="password"]')) {
  const label = input.closest('label');
  const name = label.firstChild.textContent.trim();
  const control = document.createElement('div');
  control.className = 'password-control';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button password-toggle';
  button.innerHTML = eye;
  function setVisible(visible) {
    input.type = visible ? 'text' : 'password';
    const action = (visible ? 'Hide ' : 'Show ') + name.toLowerCase();
    button.title = action;
    button.setAttribute('aria-label', action);
    button.querySelector('.eye-slash').style.display = visible ? '' : 'none';
  }
  const field = document.createElement('div');
  field.className = 'password-field';
  label.before(field);
  field.append(label, control);
  control.append(input, button);
  // Keep the original label and its hint associated with the moved field.
  input.id ||= 'password-' + input.name;
  label.htmlFor = input.id;
  const hint = label.querySelector('small');
  if (hint) field.append(hint);
  setVisible(false);
  button.addEventListener('click', () => setVisible(input.type === 'password'));
  input.form.addEventListener('reset', () => setVisible(false));
  input.closest('dialog')?.addEventListener('close', () => setVisible(false));
}
