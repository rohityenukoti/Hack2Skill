import { callTranslateBatch, callTranslateText, isCloudFunctionsAvailable } from './api';

const cache = new Map();
const BATCH_SIZE = 80;

function cacheKey(targetLanguage, text) {
  return `${targetLanguage}:${text}`;
}

async function translateBatchChunks(texts, targetLanguage) {
  const translations = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE);
    const batch = await callTranslateBatch(chunk, targetLanguage);
    const chunkTranslations = batch?.translations ?? [];
    if (chunkTranslations.length !== chunk.length) {
      throw new Error('Batch translation returned unexpected result size');
    }
    translations.push(...chunkTranslations);
  }
  return translations;
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
      const translations = await translateBatchChunks(
        uncached.map((r) => r.text),
        targetLanguage
      );
      uncached.forEach((item, index) => {
        const value = translations[index] ?? item.text;
        cache.set(cacheKey(targetLanguage, item.text), value);
        item.cached = value;
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

/** Translate all citizen portal strings in a single batched API call. */
export async function translateCitizenPortalContent(
  { uiStrings, schemes, categories },
  targetLanguage
) {
  if (targetLanguage === 'en') {
    return { ui: uiStrings, schemes, categories: [...categories] };
  }

  const uiKeys = Object.keys(uiStrings);
  const uiValues = uiKeys.map((key) => uiStrings[key]);
  const schemeNames = schemes.map((s) => s.name);
  const schemeDescriptions = schemes.map((s) => s.description);

  const allStrings = [...uiValues, ...schemeNames, ...schemeDescriptions, ...categories];
  const translated = await translateUiStrings(allStrings, targetLanguage);

  const ui = {};
  uiKeys.forEach((key, index) => {
    ui[key] = translated[index];
  });

  const offset = uiValues.length;
  const translatedSchemes = schemes.map((scheme, index) => ({
    ...scheme,
    name: translated[offset + index],
    description: translated[offset + schemeNames.length + index],
  }));

  const translatedCategories = translated.slice(
    offset + schemeNames.length + schemeDescriptions.length
  );

  return { ui, schemes: translatedSchemes, categories: translatedCategories };
}

/** Translate all home page strings in a single batched API call. */
export async function translateHomePageContent(
  { uiStrings, psaAnnouncements, features, quickStats, loginCards, footer },
  targetLanguage
) {
  if (targetLanguage === 'en') {
    return {
      ui: { ...uiStrings },
      psaAnnouncements,
      features,
      quickStats,
      loginCards,
      footer: { ...footer },
    };
  }

  const uiKeys = Object.keys(uiStrings);
  const uiValues = uiKeys.map((key) => uiStrings[key]);
  const psaTexts = psaAnnouncements.map((psa) => psa.text);
  const featureTitles = features.map((feature) => feature.title);
  const featureDescriptions = features.map((feature) => feature.description);
  const statLabels = quickStats.map((stat) => stat.label);
  const loginCardStrings = loginCards.flatMap((card) => [
    card.title,
    card.subtitle,
    ...card.features,
    card.buttonLabel,
  ]);
  const footerKeys = Object.keys(footer);
  const footerValues = footerKeys.map((key) => footer[key]);

  const allStrings = [
    ...uiValues,
    ...psaTexts,
    ...featureTitles,
    ...featureDescriptions,
    ...statLabels,
    ...loginCardStrings,
    ...footerValues,
  ];
  const translated = await translateUiStrings(allStrings, targetLanguage);

  let offset = 0;

  const ui = {};
  uiKeys.forEach((key, index) => {
    ui[key] = translated[offset + index];
  });
  offset += uiValues.length;

  const translatedPsas = psaAnnouncements.map((psa, index) => ({
    ...psa,
    text: translated[offset + index],
  }));
  offset += psaTexts.length;

  const translatedFeatures = features.map((feature, index) => ({
    ...feature,
    title: translated[offset + index],
    description: translated[offset + featureTitles.length + index],
  }));
  offset += featureTitles.length + featureDescriptions.length;

  const translatedQuickStats = quickStats.map((stat, index) => ({
    ...stat,
    label: translated[offset + index],
  }));
  offset += statLabels.length;

  const stringsPerCard = loginCards.map(
    (card) => 2 + card.features.length + 1
  );
  const translatedLoginCards = loginCards.map((card, cardIndex) => {
    const cardOffset =
      offset + stringsPerCard.slice(0, cardIndex).reduce((sum, n) => sum + n, 0);
    const featureCount = card.features.length;
    return {
      ...card,
      title: translated[cardOffset],
      subtitle: translated[cardOffset + 1],
      features: card.features.map(
        (_, featureIndex) => translated[cardOffset + 2 + featureIndex]
      ),
      buttonLabel: translated[cardOffset + 2 + featureCount],
    };
  });
  offset += loginCardStrings.length;

  const translatedFooter = {};
  footerKeys.forEach((key, index) => {
    translatedFooter[key] = translated[offset + index];
  });

  return {
    ui,
    psaAnnouncements: translatedPsas,
    features: translatedFeatures,
    quickStats: translatedQuickStats,
    loginCards: translatedLoginCards,
    footer: translatedFooter,
  };
}

export function clearTranslationCache() {
  cache.clear();
}
