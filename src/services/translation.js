import { callTranslateText, isCloudFunctionsAvailable } from './api';

const cache = new Map();

export async function translateUiText(text, targetLanguage = 'hi') {
  const cacheKey = `${targetLanguage}:${text}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  if (isCloudFunctionsAvailable()) {
    try {
      const result = await callTranslateText(text, targetLanguage);
      if (result?.translatedText) {
        cache.set(cacheKey, result.translatedText);
        return result.translatedText;
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }

  return text;
}

export function clearTranslationCache() {
  cache.clear();
}
