// Routing utilities for localized slugs and URL switching.
// Consumes ROUTE_SLUGS from routes.js (data-only).

import {
    PUBLIC_DEFAULT_LOCALE,
    PUBLIC_PREFIX_DEFAULT_LOCALE,
} from "$env/static/public";
import { ROUTE_SLUGS } from "./routes.js";
import { SUPPORTED_LANGS } from "./languages.js";

// SUPPORTED_LANGS is sourced from languages.js

/**
 * Default language (language subtag only, e.g. "en" from "en" or "en-US").
 * @type {"en"|"sl"|"de"}
 */
export const DEFAULT_LANG = (PUBLIC_DEFAULT_LOCALE || "en").split("-")[0];

/**
 * Whether the default language should be prefixed in URLs.
 * Controlled by PUBLIC_PREFIX_DEFAULT_LOCALE ("true" to enable).
 * @type {boolean}
 */
export const PREFIX_DEFAULT =
    String(PUBLIC_PREFIX_DEFAULT_LOCALE || "false").toLowerCase() === "true";

/**
 * Prefix rule: default language has no prefix, others use "/<lang>".
 * @type {{ hasPrefix: (lang: string) => boolean, apply: (path: string, lang: string) => string }}
 */
export const PREFIX_RULE = {
    hasPrefix: (lang) => (lang === DEFAULT_LANG ? PREFIX_DEFAULT : true),
    apply: (path, lang) => {
        const p = normalizePath(path);
        if (!PREFIX_RULE.hasPrefix(lang)) return p;
        return p === "/" ? `/${lang}` : `/${lang}${p}`;
    },
};

/**
 * Ensure leading slash and remove trailing slash (except for root).
 * @param {string} path
 * @returns {string}
 */
export function normalizePath(path) {
    if (!path) return "/";
    let p = path.startsWith("/") ? path : "/" + path;
    // preserve root-only
    if (p !== "/") p = p.replace(/\/+$/g, "");
    return p || "/";
}

/**
 * Build a regex for a canonical key with optional placeholders in braces, e.g. "/news/{slug}".
 * Returns the regex and the placeholder names order.
 * The regex matches from start and ends at a segment boundary.
 * @param {string} key
 * @returns {{ regex: RegExp, names: string[] }}
 */
function buildKeyRegex(key) {
    const parts = normalizePath(key).split("/").slice(1);
    const names = [];
    const pattern = parts
        .map((seg) => {
            const m = seg.match(/^\{([^/}]+)\}$/);
            if (m) {
                const raw = m[1];
                const isRest = raw.startsWith("...");
                const name = isRest ? raw.slice(3) : raw;
                names.push(name);
                // rest placeholder captures across slashes until the next fixed segment
                return isRest ? "(.+?)" : "([^/]+)";
            }
            // escape regex special chars in literal segments
            return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/");
    // must end on boundary (end or next slash)
    const rx = new RegExp(`^/${pattern}(?=$|/)`);
    return { regex: rx, names };
}

/**
 * Apply captured values to a template path with placeholders.
 * @param {string} template e.g. "/novice/{slug}"
 * @param {Record<string,string>} values
 */
function applyTemplate(template, values) {
    return normalizePath(template).replace(/\{([^/}]+)\}/g, (_, name) => {
        const n = name.startsWith("...") ? name.slice(3) : name;
        return values[n] ?? "";
    });
}

/**
 * From a mapping object, get sorted entries by descending canonical key length for longest-first matching.
 * @param {Record<string, string>} map
 */
function sortedEntries(map) {
    return Object.entries(map).sort((a, b) => b[0].length - a[0].length);
}

/**
 * Resolve the best mapping for canonical -> localized for a given language.
 * Supports placeholders and prefix matches.
 * @param {string} canonicalPath
 * @param {string} lang
 * @returns {{ localizedBase: string, matchedLength: number } | null}
 */
function matchCanonicalToLocalized(canonicalPath, lang) {
    const p = normalizePath(canonicalPath);
    const map = ROUTE_SLUGS[lang] || {};

    // If key is provided as a placeholder pattern string itself, use direct lookup
    if (/{[^}]+}/.test(p) && map[p]) {
        return { localizedBase: map[p], matchedLength: p.length };
    }

    for (const [key, localized] of sortedEntries(map)) {
        const { regex, names } = buildKeyRegex(key);
        const m = p.match(regex);
        if (!m) continue;
        const values = Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
        const localizedBase = applyTemplate(localized, values);
        return { localizedBase, matchedLength: m[0].length };
    }
    return null;
}

/**
 * Resolve best mapping for localized -> canonical for a given language.
 * Supports placeholders and prefix matches.
 * @param {string} localizedPath
 * @param {string} lang
 * @returns {{ canonicalBase: string, matchedLength: number } | null}
 */
function matchLocalizedToCanonical(localizedPath, lang) {
    const p = normalizePath(localizedPath);
    const map = ROUTE_SLUGS[lang] || {};

    // Try exact placeholder template reverse match first by synthesizing a regex from the template
    const entries = sortedEntries(map);
    for (const [canonicalKey, localizedTemplate] of entries) {
        // Build regex from localized template
        const { regex, names } = buildKeyRegex(localizedTemplate);
        const m = p.match(regex);
        if (!m) continue;
        const values = Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
        const canonicalBase = applyTemplate(canonicalKey, values);
        return { canonicalBase, matchedLength: m[0].length };
    }
    return null;
}

/**
 * Convert a canonical (EN) path to a localized path for a language.
 * Preserves placeholder values and remainder segments.
 * @param {string} canonicalPath
 * @param {string} lang
 * @returns {string}
 */
export function toLocalized(canonicalPath, lang) {
    const p = normalizePath(canonicalPath);
    const match = matchCanonicalToLocalized(p, lang || DEFAULT_LANG);
    if (!match) return p; // no mapping -> canonical equals localized

    const rest = p.slice(match.matchedLength);
    const localized = normalizePath(match.localizedBase) + rest;
    return normalizePath(localized);
}

/**
 * Convert a localized path to its canonical (EN) path for a language.
 * Preserves placeholder values and remainder segments.
 * @param {string} localizedPath
 * @param {string} lang
 * @returns {string}
 */
export function toCanonical(localizedPath, lang) {
    const p = normalizePath(localizedPath);
    const match = matchLocalizedToCanonical(p, lang || DEFAULT_LANG);
    if (!match) return p; // no mapping -> already canonical

    const rest = p.slice(match.matchedLength);
    const canonical = normalizePath(match.canonicalBase) + rest;
    return normalizePath(canonical);
}

/**
 * Strictly validate that a localized path is valid for a given language.
 * It must be exactly the result of toLocalized(toCanonical(path, lang), lang).
 * @param {string} localizedPath
 * @param {string} lang
 * @returns {boolean}
 */
export function isValidLocalizedPath(localizedPath, lang) {
    const p = normalizePath(localizedPath);
    if (p === "/") return true;

    // When default language is NOT prefixed, allow canonical slugs but disallow
    // foreign localized slugs that belong to other languages under default branch.
    const strictForThisLang = PREFIX_DEFAULT || lang !== DEFAULT_LANG;
    if (!strictForThisLang) {
        for (const [otherLang, map] of Object.entries(ROUTE_SLUGS)) {
            if (otherLang === lang) continue;
            for (const [, localizedTemplate] of Object.entries(map || {})) {
                if (!localizedTemplate) continue;
                const { regex } = buildKeyRegex(localizedTemplate);
                if (regex.test(p)) return false;
            }
        }
        return true;
    }

    // Strict round-trip validation for prefixed default or any non-default language
    const canonical = toCanonical(p, lang);
    const roundTrip = toLocalized(canonical, lang);
    return normalizePath(roundTrip) === p;
}

/**
 * Build a target URL for switching language.
 * - Detect and strip an existing language prefix if present
 * - Convert to canonical, then to the target language
 * - Apply prefix rule (no prefix for default, prefix for others)
 * - Preserve query string and hash
 *
 * @param {string} currentHref Full current path (pathname + optional query/hash) or just pathname.
 * @param {string=} fromLang Optional explicit source language; if omitted, detect from prefix.
 * @param {string} toLang Target language
 * @returns {string}
 */
export function switchLanguageUrl(currentHref, fromLang, toLang) {
    const href = currentHref || "/";
    const [beforeHash, hashPart] = href.split("#");
    const [pathnameRaw, queryPart] = beforeHash.split("?");
    const pathname = normalizePath(pathnameRaw || "/");

    // detect prefix
    const seg = pathname.split("/").filter(Boolean)[0];
    let detectedLang =
        fromLang || (seg && SUPPORTED_LANGS.includes(seg) ? seg : DEFAULT_LANG);
    let pathNoPrefix = pathname;
    if (SUPPORTED_LANGS.includes(seg || "") && seg === detectedLang) {
        const sliced = pathname.slice(("/" + seg).length);
        pathNoPrefix = normalizePath(sliced || "/");
    }

    // canonicalize from detectedLang
    const canonical = toCanonical(pathNoPrefix, detectedLang);
    // localize to target
    const localized = toLocalized(canonical, toLang);
    const withPrefix = PREFIX_RULE.apply(localized, toLang);

    const query = queryPart ? `?${queryPart}` : "";
    const hash = hashPart ? `#${hashPart}` : "";
    return `${withPrefix}${query}${hash}`;
}
