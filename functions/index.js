import { initializeApp } from 'firebase-admin/app';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

import { analyzeDistrictData, parseVoiceTranscript } from './ai.js';
import { transcribeAudioBase64 } from './speech.js';
import { syncFirestoreToBigQuery, getInventoryTrendSummary } from './bigquery.js';
import { translateText, getSupportedLanguages } from './translation.js';
import { seedDemoUsersAndData, DEMO_USERS } from './seed.js';
import { MOCK_CENTERS, MOCK_INVENTORY } from './mockData.js';

initializeApp();

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function checkRateLimit(uid) {
  const now = Date.now();
  const entry = rateLimitMap.get(uid) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  rateLimitMap.set(uid, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait a minute.');
  }
}

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  checkRateLimit(request.auth.uid);
  return request.auth;
}

function withGeminiKey(handler) {
  return async (request) => {
    process.env.GEMINI_API_KEY = geminiApiKey.value();
    return handler(request);
  };
}

export const analyzeDistrict = onCall(
  { secrets: [geminiApiKey], region: 'asia-south1', maxInstances: 10 },
  withGeminiKey(async (request) => {
    requireAuth(request);
    const { centers, inventories } = request.data || {};
    if (!centers || !inventories) {
      throw new HttpsError('invalid-argument', 'centers and inventories are required');
    }

    let trendSummary = null;
    try {
      trendSummary = await getInventoryTrendSummary();
    } catch {
      trendSummary = null;
    }

    return analyzeDistrictData(centers, inventories, trendSummary);
  })
);

export const parseVoiceReport = onCall(
  { secrets: [geminiApiKey], region: 'asia-south1', maxInstances: 10 },
  withGeminiKey(async (request) => {
    requireAuth(request);
    const { transcript, centerName } = request.data || {};
    if (!transcript || !centerName) {
      throw new HttpsError('invalid-argument', 'transcript and centerName are required');
    }
    return parseVoiceTranscript(transcript, centerName);
  })
);

export const transcribeAudio = onCall(
  { region: 'asia-south1', maxInstances: 10 },
  async (request) => {
    requireAuth(request);
    const { audioBase64, encoding, sampleRateHertz } = request.data || {};
    if (!audioBase64) {
      throw new HttpsError('invalid-argument', 'audioBase64 is required');
    }
    try {
      return await transcribeAudioBase64(audioBase64, encoding, sampleRateHertz);
    } catch (error) {
      console.error('transcribeAudio error:', error);
      throw new HttpsError('internal', error.message || 'Transcription failed');
    }
  }
);

export const translateTextFn = onCall(
  { region: 'asia-south1', maxInstances: 10 },
  async (request) => {
    requireAuth(request);
    const { text, targetLanguage } = request.data || {};
    if (!text) {
      throw new HttpsError('invalid-argument', 'text is required');
    }
    try {
      return await translateText(text, targetLanguage || 'hi');
    } catch (error) {
      console.error('translateText error:', error);
      throw new HttpsError('internal', error.message || 'Translation failed');
    }
  }
);

export const getLanguages = onCall({ region: 'asia-south1' }, async (request) => {
  requireAuth(request);
  return getSupportedLanguages();
});

export const syncToBigQuery = onCall(
  { region: 'asia-south1', maxInstances: 3 },
  async (request) => {
    requireAuth(request);
    const { getFirestore } = await import('firebase-admin/firestore');
    const userDoc = await getFirestore().doc(`users/${request.auth.uid}`).get();
    const role = userDoc.data()?.role;
    if (role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required');
    }
    try {
      return await syncFirestoreToBigQuery();
    } catch (error) {
      console.error('syncToBigQuery error:', error);
      throw new HttpsError('internal', error.message || 'BigQuery sync failed');
    }
  }
);

export const scheduledBigQuerySync = onSchedule(
  { schedule: 'every 24 hours', region: 'asia-south1' },
  async () => {
    try {
      await syncFirestoreToBigQuery();
    } catch (error) {
      console.error('Scheduled BigQuery sync failed:', error);
    }
  }
);

export const seedDemoAccounts = onCall(
  { region: 'asia-south1', maxInstances: 1 },
  async (request) => {
    if (process.env.FUNCTIONS_EMULATOR !== 'true' && !request.data?.confirmSeed) {
      throw new HttpsError(
        'failed-precondition',
        'Pass { confirmSeed: true } to seed demo accounts. Run once after deploy.'
      );
    }
    const result = await seedDemoUsersAndData(MOCK_CENTERS, MOCK_INVENTORY);
    return {
      ...result,
      demoCredentials: DEMO_USERS.map(({ email, password, role, centerId }) => ({
        email,
        password,
        role,
        centerId: centerId ?? null,
      })),
    };
  }
);

export const provisionCitizenProfile = onCall({ region: 'asia-south1' }, async (request) => {
  const auth = requireAuth(request);
  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();
  await db.doc(`users/${auth.uid}`).set(
    {
      role: 'citizen',
      email: auth.token.email ?? null,
      isAnonymous: !auth.token.email,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { success: true, role: 'citizen' };
});
