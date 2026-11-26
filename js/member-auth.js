import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// Keep membership separate from the existing device-based Friends identity.
export const auth = getAuth(initializeApp(firebaseConfig, 'prestige-members'));
