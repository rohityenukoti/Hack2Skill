import { v2 } from '@google-cloud/translate';

const translate = new v2.Translate();

const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  kn: 'Kannada',
  te: 'Telugu',
  ta: 'Tamil',
};

function normalizeLanguageCode(code) {
  if (!code || code === 'en') return 'en';
  return SUPPORTED_LANGUAGES[code] ? code : 'hi';
}

export async function translateText(text, targetLanguage = 'hi') {
  const lang = normalizeLanguageCode(targetLanguage);
  if (!text?.trim()) {
    return { translatedText: '', targetLanguage: lang, sourceLanguage: 'en' };
  }
  if (lang === 'en') {
    return { translatedText: text, targetLanguage: 'en', sourceLanguage: 'en' };
  }

  const [translation] = await translate.translate(text, lang);
  const [detection] = await translate.detect(text);

  return {
    translatedText: translation,
    targetLanguage: lang,
    sourceLanguage: detection.language,
  };
}

export async function translateBatch(texts, targetLanguage = 'hi') {
  const lang = normalizeLanguageCode(targetLanguage);
  const items = Array.isArray(texts) ? texts : [];
  if (!items.length) {
    return { translations: [], targetLanguage: lang };
  }
  if (lang === 'en') {
    return { translations: items, targetLanguage: 'en' };
  }

  const [translations] = await translate.translate(items, lang);
  const normalized = Array.isArray(translations) ? translations : [translations];

  return {
    translations: normalized,
    targetLanguage: lang,
  };
}

export function getSupportedLanguages() {
  return {
    languages: Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => ({ code, label })),
  };
}
