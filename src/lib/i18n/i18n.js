// Translations API: dictionaries, translators and the reactive i18n context.
//
// The context follows the documented SvelteKit pattern (see "Using state and
// stores with context"): it is set ONCE during root layout init with a getter
// over reactive state. Components fetch stable functions at init
// (`const t = useT()`) and call them in templates; every call re-reads the
// current language, so client-side language switches update all translations
// without a full reload.

import { setContext, getContext } from "svelte";
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

// Load and deep-merge all JSON files under src/lib/locales/<lang>/*.json
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
 * Create a translator for a language.
 * Supports dot-notation keys and {var} interpolation.
 * Returns non-string values (arrays, objects, numbers, booleans) as-is.
 * Missing keys fall back to the DEFAULT_LANG dictionary before returning
 * the raw key.
 * @param {string} lang
 * @returns {(key: string, vars?: Record<string, string | number>) => any}
 */
export function makeT(lang) {
    const base = DICTS[lang] || {};
    const fallback = DICTS[DEFAULT_LANG] || {};
    return (key, vars) => {
        let raw = getDot(base, key);
        if (raw === undefined && base !== fallback)
            raw = getDot(fallback, key);
        if (raw === undefined) return key;
        if (typeof raw !== "string") return structuredClone(raw);
        if (!vars) return raw;
        return raw.replace(/\{([^}]+)\}/g, (_, name) => {
            const v = vars[name];
            return v == null ? "" : String(v);
        });
    };
}

/**
 * Cache: lang -> translator. DICTS is immutable module data, so translator
 * instances are pure and safe to share process-wide, including across SSR
 * requests. Bounded by the number of languages.
 * @type {Map<string, ReturnType<typeof makeT>>}
 */
const TRANSLATORS = new Map();

/**
 * Cached translator for a language; unknown languages fall back to
 * DEFAULT_LANG dictionaries.
 * @param {string} lang
 * @returns {(key: string, vars?: Record<string, string | number>) => any}
 */
export function translatorFor(lang) {
    const l = lang && DICTS[lang] ? lang : DEFAULT_LANG;
    let fn = TRANSLATORS.get(l);
    if (!fn) {
        fn = makeT(l);
        TRANSLATORS.set(l, fn);
    }
    return fn;
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
 *   language.
 * @property {(canonicalPath: string) => string} translatePath
 *   Canonical path -> localized, prefixed path for the current language.
 */

/**
 * Install the i18n context. MUST be called exactly once, during root layout
 * component init (Svelte only allows setContext there). Returns the context
 * object so the layout itself can use `t` directly.
 * @param {() => string | undefined} getLang Reactive getter, e.g. `() => data.lang`.
 * @returns {I18nContext}
 */
export function setI18nContext(getLang) {
    const read = () => getLang() || DEFAULT_LANG;
    /** @type {I18nContext} */
    const ctx = {
        get lang() {
            return read();
        },
        t: (key, vars) => translatorFor(read())(key, vars),
        translatePath: (canonicalPath) =>
            translatePathFor(canonicalPath, read()),
    };
    setContext(CTX_I18N, ctx);
    return ctx;
}

/**
 * Read the i18n context. MUST be called during component init.
 * Falls back to a DEFAULT_LANG-bound object when no context exists — the
 * root +error.svelte renders without the root layout when the layout itself
 * fails, and must not crash.
 * @returns {I18nContext}
 */
export function useI18n() {
    /** @type {I18nContext | undefined} */
    const ctx = getContext(CTX_I18N);
    if (ctx) return ctx;
    return {
        lang: DEFAULT_LANG,
        t: (key, vars) => translatorFor(DEFAULT_LANG)(key, vars),
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
