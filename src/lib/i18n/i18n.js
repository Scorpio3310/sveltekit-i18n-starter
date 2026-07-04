// Translations API: lazy dictionaries, translators and the reactive i18n
// context.
//
// Dictionaries are loaded per language via dynamic import (Vite code-splits
// each locale JSON into its own chunk), so the client only downloads the
// active language — plus the default language, which is deep-merged
// underneath as the fallback for missing keys. The bundle no longer grows
// with every language you add.
//
// The context follows the documented SvelteKit pattern (see "Using state and
// stores with context"): it is set ONCE during root layout init with getters
// over reactive state. Components fetch stable functions at init
// (`const t = useT()`) and call them in templates; every call re-reads the
// current language, so client-side language switches update all translations
// without a full reload.

import { setContext, getContext } from "svelte";
import { dev } from "$app/environment";
import {
    DEFAULT_LANG,
    toLocalized as _toLocalized,
    PREFIX_RULE,
} from "./routing.js";
import { LANGUAGES } from "./languages.js";

// Re-exported metadata from a single source
export { LANGUAGES };

/** Default language (language subtag only). */
export { DEFAULT_LANG };

/** Re-export: builds a language-switch URL. Pure, safe in event handlers. */
export { switchLanguageUrl } from "./routing.js";

/**
 * Lazy loaders for all JSON files under src/lib/locales/<lang>/*.json.
 * @type {Record<string, () => Promise<any>>}
 */
const localeModules = import.meta.glob("../locales/*/*.json", {
    import: "default",
});

/**
 * Deep merge of plain objects. Arrays and non-objects overwrite.
 * @param {any} target
 * @param {any} source
 */
function deepMerge(target, source) {
    if (target == null || typeof target !== "object" || Array.isArray(target))
        return structuredClone(source);
    if (source == null || typeof source !== "object" || Array.isArray(source))
        return structuredClone(source);
    /** @type {Record<string, any>} */
    const out = { ...target };
    for (const [k, v] of Object.entries(source)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
            out[k] = deepMerge(out[k] ?? {}, v);
        } else {
            out[k] = structuredClone(v);
        }
    }
    return out;
}

/**
 * Load and merge the raw dictionary files of one language.
 * @param {string} lang
 * @returns {Promise<Record<string, any>>}
 */
async function loadRawDict(lang) {
    /** @type {Record<string, any>} */
    let dict = {};
    for (const [path, loader] of Object.entries(localeModules)) {
        const m = path.match(/..\/locales\/([^/]+)\//);
        if (!m || m[1] !== lang) continue;
        dict = deepMerge(dict, await loader());
    }
    return dict;
}

/**
 * Cache: lang -> merged dictionary (with the DEFAULT_LANG fallback baked
 * in). Dictionaries are static module data, so caching across requests is
 * safe; the cache is bounded by the number of languages.
 * @type {Map<string, Promise<Record<string, any>>>}
 */
const DICT_CACHE = new Map();

/**
 * Dictionary for a language, deep-merged over the DEFAULT_LANG dictionary
 * so missing keys fall back to the default language.
 * @param {string} [lang]
 * @returns {Promise<Record<string, any>>}
 */
export function loadDict(lang) {
    const l = lang || DEFAULT_LANG;
    let cached = DICT_CACHE.get(l);
    if (!cached) {
        cached =
            l === DEFAULT_LANG
                ? loadRawDict(l)
                : Promise.all([loadRawDict(DEFAULT_LANG), loadRawDict(l)]).then(
                      ([fallback, own]) => deepMerge(fallback, own)
                  );
        DICT_CACHE.set(l, cached);
    }
    return cached;
}

/**
 * Retrieve a nested value from an object using dot-notation.
 * @param {Record<string, any>} obj
 * @param {string} key
 * @returns {any}
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
 * Translate a key against a dictionary. Supports dot-notation keys and
 * {var} interpolation; returns non-string values (arrays, objects, numbers,
 * booleans) as-is and the raw key when nothing matches.
 * @param {Record<string, any>} dict
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 * @returns {any}
 */
function translate(dict, key, vars) {
    const raw = getDot(dict, key);
    if (raw === undefined) return key;
    if (typeof raw !== "string") return structuredClone(raw);
    if (!vars) return raw;
    return raw.replace(/\{([^}]+)\}/g, (_, name) => {
        const v = vars[name];
        return v == null ? "" : String(v);
    });
}

/**
 * Create a translator over a loaded dictionary.
 * @param {Record<string, any>} dict
 * @returns {(key: string, vars?: Record<string, string | number>) => any}
 */
export function makeT(dict) {
    return (key, vars) => translate(dict, key, vars);
}

/**
 * Cached translator for a language (async — loads the dictionary on first
 * use). Used by hooks.server.js for `locals.t`.
 * @param {string} [lang]
 * @returns {Promise<(key: string, vars?: Record<string, string | number>) => any>}
 */
export function translatorFor(lang) {
    return loadDict(lang).then(makeT);
}

/**
 * Translate a canonical path to a localized, prefixed path for a given
 * language. Pure — safe to use in event handlers and on the server.
 * @param {string} canonicalPath
 * @param {string} [lang] Defaults to DEFAULT_LANG.
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

// ---------------------------------------------------------------------------
// Reactive i18n context
// ---------------------------------------------------------------------------

const CTX_I18N = "i18n";

/**
 * @typedef {Object} I18nContext
 * @property {string} lang Current language. Reactive when read during render.
 * @property {(key: string, vars?: Record<string, string | number>) => any} t
 *   Translate a key. Stable function identity; the result tracks the current
 *   language and dictionary.
 * @property {(canonicalPath: string) => string} translatePath
 *   Canonical path -> localized, prefixed path for the current language.
 */

/**
 * Install the i18n context. MUST be called exactly once, during root layout
 * component init (Svelte only allows setContext there). Returns the context
 * object so the layout itself can use `t` directly.
 * @param {() => string | undefined} getLang Reactive getter, e.g. `() => data.lang`.
 * @param {() => Record<string, any> | undefined} getDict Reactive getter over
 *   the active dictionary, e.g. `() => data.dict` (loaded in +layout.js).
 * @returns {I18nContext}
 */
export function setI18nContext(getLang, getDict) {
    const readLang = () => getLang() || DEFAULT_LANG;
    /** @type {I18nContext} */
    const ctx = {
        get lang() {
            return readLang();
        },
        t: (key, vars) => translate(getDict() ?? {}, key, vars),
        translatePath: (canonicalPath) =>
            translatePathFor(canonicalPath, readLang()),
    };
    setContext(CTX_I18N, ctx);
    return ctx;
}

/**
 * Read the i18n context. MUST be called during component init.
 * Falls back to a DEFAULT_LANG-bound object when no context exists — the
 * root +error.svelte renders without the root layout when the layout itself
 * fails, and must not crash. Without a dictionary the fallback returns raw
 * keys (src/error.html is the styled last resort for that case).
 * @returns {I18nContext}
 */
export function useI18n() {
    /** @type {I18nContext | undefined} */
    const ctx = getContext(CTX_I18N);
    if (ctx) return ctx;
    if (dev) {
        console.warn(
            "[i18n] useI18n() called without an i18n context — did the root layout call setI18nContext()?"
        );
    }
    return {
        lang: DEFAULT_LANG,
        t: (key) => key,
        translatePath: (p) => translatePathFor(p, DEFAULT_LANG),
    };
}

/**
 * Convenience: `const t = useT()` at component init, then `{t('key')}` in
 * the template.
 * @returns {I18nContext['t']}
 */
export function useT() {
    return useI18n().t;
}

/**
 * Convenience: `const translatePath = useTranslatePath()` at component init.
 * @returns {I18nContext['translatePath']}
 */
export function useTranslatePath() {
    return useI18n().translatePath;
}
