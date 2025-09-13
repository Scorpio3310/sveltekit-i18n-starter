// Translations API with auto-loading and i18n helpers.
// Also re-exports helpers used by Navbar for backward compatibility.

import { setContext, getContext } from "svelte";
import {
    DEFAULT_LANG,
    toLocalized as _toLocalized,
    switchLanguageUrl as _switchLanguageUrl,
    PREFIX_RULE,
} from "./routing.js";
import { LANGUAGES, SUPPORTED_LANGS } from "./languages.js";

// Re-exported metadata from a single source
export { LANGUAGES };

/**
 * Default language (language subtag only).
 * @type {"en"|"sl"|"de"}
 */
export { DEFAULT_LANG };

/**
 * Alias used across codebase.
 */
export const languages = [...SUPPORTED_LANGS];

// Load and deep-merge all JSON files under src/locales/<lang>/*.json
const localeModules = import.meta.glob("../locales/*/*.json", {
    eager: true,
    import: "default",
});

/**
 * Deep merge of plain objects. Arrays and non-objects overwrite.
 * @param {any} target
 * @param {any} source
 */
function deepMerge(target, source) {
    if (target == null || typeof target !== "object" || Array.isArray(target))
        return jsonClone(source);
    if (source == null || typeof source !== "object" || Array.isArray(source))
        return jsonClone(source);
    /** @type {Record<string, any>} */
    const out = { ...target };
    for (const [k, v] of Object.entries(source)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
            out[k] = deepMerge(out[k] ?? {}, v);
        } else {
            out[k] = jsonClone(v);
        }
    }
    return out;
}

/**
 * Cheap safe JSON-based clone for plain data.
 * @template T
 * @param {T} v
 * @returns {T}
 */
function jsonClone(v) {
    return v == null ? v : /** @type {T} */ (JSON.parse(JSON.stringify(v)));
}

/**
 * Load dictionaries per language.
 * @type {Record<string, Record<string, any>>}
 */
const DICTS = (() => {
    /** @type {Record<string, Record<string, any>>} */
    const dicts = {};
    for (const [path, data] of Object.entries(localeModules)) {
        const m = path.match(/..\/locales\/([^/]+)\//);
        if (!m) continue;
        const lang = m[1];
        dicts[lang] = deepMerge(dicts[lang] || {}, /** @type {any} */ (data));
    }
    return dicts;
})();

/**
 * Retrieve a nested value from an object using dot-notation.
 * @param {Record<string, any>} obj
 * @param {string} key
 */
function getDot(obj, key) {
    const parts = key.split(".");
    let cur = obj;
    for (const p of parts) {
        if (cur && typeof cur === "object" && p in cur) cur = cur[p];
        else return undefined;
    }
    return cur;
}

/**
 * Create a translator for a language.
 * Supports dot-notation keys and {var} interpolation.
 * @param {string} lang
 * @returns {(key: string, vars?: Record<string, string | number>) => string}
 */
export function makeT(lang) {
    const base = DICTS[lang] || {};
    return (key, vars) => {
        const raw = getDot(base, key);
        const str = typeof raw === "string" ? raw : key;
        if (!vars) return str;
        return str.replace(/\{([^}]+)\}/g, (_, name) => {
            const v = vars[name];
            return v == null ? "" : String(v);
        });
    };
}

// Context keys
const CTX_T = "i18n:t";
const CTX_LANG = "i18n:lang";

/**
 * Set the translation context to a language.
 * @param {string} lang
 */
export function setTContext(lang) {
    const t = makeT(lang);
    setContext(CTX_T, t);
    setContext(CTX_LANG, lang);
}

/**
 * Get the translator function from context.
 * @returns {(key: string, vars?: Record<string, string | number>) => string}
 */
export function useT() {
    const t = getContext(CTX_T);
    if (typeof t === "function") return t;
    return makeT(DEFAULT_LANG);
}

/**
 * Convenience: direct translator using current context.
 * @param {string} key
 * @param {Record<string, string|number>=} vars
 */
export function t(key, vars) {
    return useT()(key, vars);
}

/**
 * Translate a canonical path to a localized, prefixed path for the current context language.
 * @param {string} canonicalPath
 * @returns {string}
 */
export function translatePath(canonicalPath) {
    const lang = getContext(CTX_LANG) || DEFAULT_LANG;
    return translatePathFor(canonicalPath, lang);
}

/**
 * Wrapper to match Navbar's usage: switch to target language from current pathname.
 * @param {string} toLang
 * @param {string} currentHref
 * @returns {string}
 */
export function switchLanguageUrl(toLang, currentHref) {
    return _switchLanguageUrl(currentHref || "/", undefined, toLang);
}

/**
 * Translate a canonical path to a localized, prefixed path for a given language.
 * Safe to use in event handlers (does not read Svelte context).
 * @param {string} canonicalPath
 * @param {string} lang
 * @returns {string}
 */
export function translatePathFor(canonicalPath, lang) {
    const localized = _toLocalized(canonicalPath, lang || DEFAULT_LANG);
    return PREFIX_RULE.apply(localized, lang || DEFAULT_LANG);
}

/**
 * Returns BCP-47 locale for Intl.* API (e.g. 'sl-SI') based on language code.
 * If LANGUAGES[lang].locales exists, returns first entry, otherwise returns lang or DEFAULT_LANG.
 * @param {string} lang
 * @param {{ fallback?: string }=} opts
 * @returns {string}
 */
export function localeForIntl(lang, opts) {
    const fallback = opts?.fallback ?? DEFAULT_LANG;
    const entry = LANGUAGES[lang];
    if (entry && Array.isArray(entry.locales) && entry.locales.length > 0) {
        return entry.locales[0];
    }
    return lang || fallback;
}
