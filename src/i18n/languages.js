// Central language registry
// Define languages once here and reuse across i18n modules.

/**
 * Languages metadata.
 * @type {{ [code: string]: { label: string, locales: string[] } }}
 */
export const LANGUAGES = {
    en: { label: "English", locales: ["en-US", "en-GB"] },
    sl: { label: "Slovenščina", locales: ["sl-SI"] },
    de: { label: "Deutsch", locales: ["de-DE"] },
};

/**
 * Supported language codes derived from LANGUAGES keys.
 * @type {readonly string[]}
 */
export const SUPPORTED_LANGS = Object.freeze(Object.keys(LANGUAGES));
