export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
];

const PREFERRED_LANGUAGE_KEY = 'chikitsalay_preferred_language';

export function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(PREFERRED_LANGUAGE_KEY);
    if (stored && LANGUAGE_OPTIONS.some((opt) => opt.code === stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }
  return 'en';
}

export function setStoredLanguage(code) {
  try {
    localStorage.setItem(PREFERRED_LANGUAGE_KEY, code);
  } catch {
    // localStorage may be unavailable
  }
}
