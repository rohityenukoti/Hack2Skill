import {
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseAuth, getDb, getFirebaseFunctions, isFirebaseLive } from './firebaseApp';

const DEMO_USERS = {
  admin: { email: 'admin@dharwad.demo', password: 'Admin@123456' },
  'phc-narendra': { email: 'phc-narendra@dharwad.demo', password: 'Staff@123456', centerId: 'phc-narendra' },
  'phc-hebballi': { email: 'phc-hebballi@dharwad.demo', password: 'Staff@123456', centerId: 'phc-hebballi' },
  'chc-kalghatgi': { email: 'chc-kalghatgi@dharwad.demo', password: 'Staff@123456', centerId: 'chc-kalghatgi' },
};

let mockAuthState = null;
const mockListeners = new Set();

function notifyMockListeners() {
  mockListeners.forEach((cb) => cb(mockAuthState));
}

async function fetchUserProfile(uid) {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchUserProfileWithRetry(uid) {
  // Citizen sign-in provisions the profile via a Cloud Function, which can race
  // the initial auth state change. Retry briefly to avoid "role: null" sticky state.
  const delaysMs = [0, 150, 300, 600, 1200];
  for (const d of delaysMs) {
    if (d) await sleep(d);
    try {
      const profile = await fetchUserProfile(uid);
      if (profile?.role) return profile;
    } catch {
      // ignore transient read errors; caller will fall back to null
    }
  }
  return await fetchUserProfile(uid);
}

export function subscribeToAuth(callback) {
  const auth = getFirebaseAuth();
  if (auth && isFirebaseLive()) {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }
      const profile = await fetchUserProfileWithRetry(user.uid);
      callback({
        uid: user.uid,
        email: user.email,
        role: profile?.role ?? null,
        centerId: profile?.centerId ?? null,
        districtId: profile?.districtId ?? null,
        displayName: profile?.displayName ?? user.displayName,
      });
    });
  }

  callback(mockAuthState);
  mockListeners.add(callback);
  return () => mockListeners.delete(callback);
}

export async function signInAdmin(email, password) {
  const auth = getFirebaseAuth();
  if (!auth || !isFirebaseLive()) {
    mockAuthState = { uid: 'mock-admin', email, role: 'admin', districtId: 'DHARWAD-01', displayName: 'District Admin' };
    notifyMockListeners();
    return mockAuthState;
  }
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await fetchUserProfile(cred.user.uid);
  if (profile?.role !== 'admin') throw new Error('This account does not have administrator access.');
  return { uid: cred.user.uid, email: cred.user.email, ...profile };
}

export async function signInHealthCenter(email, password) {
  const auth = getFirebaseAuth();
  if (!auth || !isFirebaseLive()) {
    const demoEntry = Object.values(DEMO_USERS).find((u) => u.email === email);
    mockAuthState = {
      uid: 'mock-staff',
      email,
      role: 'healthcenter',
      centerId: demoEntry?.centerId ?? 'phc-narendra',
      displayName: 'Health Center Staff',
    };
    notifyMockListeners();
    return mockAuthState;
  }
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await fetchUserProfile(cred.user.uid);
  if (profile?.role !== 'healthcenter') throw new Error('This account does not have health center access.');
  return { uid: cred.user.uid, email: cred.user.email, ...profile };
}

export async function signInCitizen() {
  const auth = getFirebaseAuth();
  const functions = getFirebaseFunctions();
  if (!auth || !isFirebaseLive()) {
    mockAuthState = { uid: 'mock-citizen', email: null, role: 'citizen', displayName: 'Citizen' };
    notifyMockListeners();
    return mockAuthState;
  }
  const cred = await signInAnonymously(auth);
  if (functions) {
    const provision = httpsCallable(functions, 'provisionCitizenProfile');
    await provision();
  }
  const profile = await fetchUserProfile(cred.user.uid);
  return { uid: cred.user.uid, email: cred.user.email, role: 'citizen', ...profile };
}

export async function signOut() {
  const auth = getFirebaseAuth();
  if (auth && isFirebaseLive()) {
    await firebaseSignOut(auth);
    return;
  }
  mockAuthState = null;
  notifyMockListeners();
}

export function getDemoCredentials() {
  return DEMO_USERS;
}

export async function seedDemoAccounts() {
  const functions = getFirebaseFunctions();
  if (!functions) throw new Error('Firebase Functions not available');
  const seedFn = httpsCallable(functions, 'seedDemoAccounts');
  return seedFn({ confirmSeed: true });
}
