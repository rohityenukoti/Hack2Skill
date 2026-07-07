import { v2 } from '@google-cloud/translate';

const translate = new v2.Translate();

const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  kn: 'Kannada',
  te: 'Telugu',
  ta: 'Tamil',
};

export async function translateText(text, targetLanguage = 'hi') {
  if (!text?.trim()) {
    return { translatedText: '', targetLanguage, sourceLanguage: 'en' };
  }

  const [translation] = await translate.translate(text, targetLanguage);
  const [detection] = await translate.detect(text);

  return {
    translatedText: translation,
    targetLanguage,
    sourceLanguage: detection.language,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}

export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}
