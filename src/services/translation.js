import { callTranslateBatch, callTranslateText, isCloudFunctionsAvailable } from './api';

const cache = new Map();

function cacheKey(targetLanguage, text) {
  return `${targetLanguage}:${text}`;
}

export async function translateUiText(text, targetLanguage = 'hi') {
  if (!text || targetLanguage === 'en') return text;

  const key = cacheKey(targetLanguage, text);
  if (cache.has(key)) return cache.get(key);

  if (isCloudFunctionsAvailable()) {
    try {
      const result = await callTranslateText(text, targetLanguage);
      if (result?.translatedText) {
        cache.set(key, result.translatedText);
        return result.translatedText;
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }

  return text;
}

export async function translateUiStrings(strings, targetLanguage = 'hi') {
  if (!strings?.length || targetLanguage === 'en') return [...strings];

  const results = strings.map((text) => {
    const key = cacheKey(targetLanguage, text);
    if (cache.has(key)) return { text, cached: cache.get(key) };
    return { text, cached: null };
  });

  const uncached = results.filter((r) => r.cached === null);
  if (uncached.length > 0 && isCloudFunctionsAvailable()) {
    try {
      const batch = await callTranslateBatch(
        uncached.map((r) => r.text),
        targetLanguage
      );
      const translations = batch?.translations ?? [];
      uncached.forEach((item, index) => {
        const translated = translations[index] ?? item.text;
        cache.set(cacheKey(targetLanguage, item.text), translated);
        item.cached = translated;
      });
    } catch (error) {
      console.error('Batch translation failed:', error);
      uncached.forEach((item) => {
        item.cached = item.text;
      });
    }
  } else {
    uncached.forEach((item) => {
      item.cached = item.text;
    });
  }

  return results.map((r) => r.cached ?? r.text);
}

export async function translateUiObject(stringMap, targetLanguage = 'hi') {
  if (!stringMap || targetLanguage === 'en') return { ...stringMap };

  const keys = Object.keys(stringMap);
  const values = keys.map((key) => stringMap[key]);
  const translated = await translateUiStrings(values, targetLanguage);

  return keys.reduce((acc, key, index) => {
    acc[key] = translated[index];
    return acc;
  }, {});
}

export function clearTranslationCache() {
  cache.clear();
}
