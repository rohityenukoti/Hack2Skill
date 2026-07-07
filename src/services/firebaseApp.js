import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const CONFIG_KEY = 'smart_health_firebase_config';

export function getFirebaseConfig() {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };
  }

  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(CONFIG_KEY);
  } else {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
  window.location.reload();
}

export function getSavedFirebaseConfig() {
  return getFirebaseConfig();
}

const config = getFirebaseConfig();
let firebaseApp = null;
let db = null;
let auth = null;
let functions = null;
let useRealFirebase = false;
let emulatorsConnected = false;

if (config?.apiKey) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    functions = getFunctions(firebaseApp, 'asia-south1');
    useRealFirebase = true;

    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      connectEmulators();
    }

    if (import.meta.env.PROD && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

function connectEmulators() {
  if (emulatorsConnected || !db || !auth || !functions) return;
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  emulatorsConnected = true;
}

export function isFirebaseLive() {
  return useRealFirebase;
}

export function getDb() {
  return db;
}

export function getFirebaseAuth() {
  return auth;
}

export function getFirebaseFunctions() {
  return functions;
}

export function getFirebaseApp() {
  return firebaseApp;
}
