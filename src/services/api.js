import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions, isFirebaseLive } from './firebaseApp';

function getCallable(name) {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  return httpsCallable(functions, name);
}

export async function callAnalyzeDistrict(centers, inventories) {
  const fn = getCallable('analyzeDistrict');
  if (!fn || !isFirebaseLive()) return null;
  const result = await fn({ centers, inventories });
  return result.data;
}

export async function callParseVoiceReport(transcript, centerName) {
  const fn = getCallable('parseVoiceReport');
  if (!fn || !isFirebaseLive()) return null;
  const result = await fn({ transcript, centerName });
  return result.data;
}

export async function callTranscribeAudio(audioBase64, encoding = 'WEBM_OPUS', sampleRateHertz = 48000) {
  const fn = getCallable('transcribeAudio');
  if (!fn || !isFirebaseLive()) return null;
  const result = await fn({ audioBase64, encoding, sampleRateHertz });
  return result.data;
}

export async function callTranslateText(text, targetLanguage = 'hi') {
  const fn = getCallable('translateTextFn');
  if (!fn || !isFirebaseLive()) return null;
  const result = await fn({ text, targetLanguage });
  return result.data;
}

export async function callSyncToBigQuery() {
  const fn = getCallable('syncToBigQuery');
  if (!fn || !isFirebaseLive()) return null;
  const result = await fn({});
  return result.data;
}

export function isCloudFunctionsAvailable() {
  return isFirebaseLive() && !!getFirebaseFunctions();
}

export async function testCloudFunctions() {
  const fn = getCallable('getLanguages');
  if (!fn || !isFirebaseLive()) {
    throw new Error('Firebase not configured — add VITE_FIREBASE_* vars to .env and rebuild.');
  }
  const result = await fn({});
  return result.data;
}
