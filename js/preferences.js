const key = 'prestige-settings';
const sizes = { standard: '100%', large: '112.5%', 'extra-large': '125%' };

export function readPreferences() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(key));
  } catch {}
  return {
    sound: saved?.sound === true,
    textSize: Object.hasOwn(sizes, saved?.textSize) ? saved.textSize : 'standard',
  };
}

export function applyTextSize(textSize) {
  document.documentElement.style.fontSize = sizes[textSize];
  document.documentElement.dataset.textSize = textSize;
}

export function savePreferences(changes) {
  const preferences = { ...readPreferences(), ...changes };
  try {
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch {
    return false;
  }
  applyTextSize(preferences.textSize);
  return true;
}

applyTextSize(readPreferences().textSize);
