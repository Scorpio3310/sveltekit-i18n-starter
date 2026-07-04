// Routing utilities for localized slugs and URL switching.
// Consumes ROUTE_SLUGS from routes.js (data-only).

import { env } from "$env/dynamic/public";
import { ROUTE_SLUGS } from "./routes.js";
import { SUPPORTED_LANGS } from "./languages.js";

// SUPPORTED_LANGS is sourced from languages.js
// Env is read via $env/dynamic/public so a fresh clone runs without a .env
// file (a missing $env/static/* import is a hard build error).

/**
 * Default language (language subtag only, e.g. "en" from "en" or "en-US").
 * @type {string}
 */
export const DEFAULT_LANG = (env.PUBLIC_DEFAULT_LOCALE || "en").split("-")[0];

/**
 * Whether the default language should be prefixed in URLs.
 * Controlled by PUBLIC_PREFIX_DEFAULT_LOCALE ("true" to enable).
 * @type {boolean}
 */
export const PREFIX_DEFAULT =
    String(env.PUBLIC_PREFIX_DEFAULT_LOCALE || "false").toLowerCase() ===
    "true";

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
 * Normalized, decoded pathname of a path/href (query and hash stripped).
 * Single source of truth for path comparison — see isCurrentRoute().
 * @param {string | undefined | null} href
 * @returns {string}
 */
export function pathnameOf(href) {
    return splitPath(href || "/").pathname;
}

/**
 * Split a path into its pathname and query/hash suffix, then normalize.
 *
 * The pathname is matched in its raw, percent-encoded form (ROUTE_SLUGS
 * templates are ASCII by contract, so they match encoded ASCII paths). We
 * deliberately do NOT decode: matching decoded would force us to re-encode
 * dynamic {slug}/{...rest} captures on output, and getting that wrong
 * double-decodes them — e.g. a slug "50%" (/pages/50%25) would break, and
 * "%2F" would be mistaken for a real separator. Preserving the encoded form
 * keeps reroute output byte-identical to what SvelteKit expects.
 * @param {string} path
 * @returns {{ pathname: string, suffix: string }}
 */
function splitPath(path) {
    const raw = path || "/";
    const hashIndex = raw.indexOf("#");
    const beforeHash = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
    const queryIndex = beforeHash.indexOf("?");
    const pathnameRaw =
        queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
    const suffix = raw.slice(pathnameRaw.length);
    return { pathname: normalizePath(pathnameRaw), suffix };
}

/**
 * Build a regex for a template with optional full-segment placeholders in
 * braces, e.g. "/news/{slug}" or "/news/{...rest}". Returns the regex and
 * the placeholder names in order. Matches from the start and ends at a
 * segment boundary.
 * @param {string} key
 * @returns {{ regex: RegExp, names: string[] }}
 */
function buildKeyRegex(key) {
    const parts = normalizePath(key).split("/").slice(1);
    /** @type {string[]} */
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
 * Classify template segments for specificity ranking.
 * @param {string} key
 * @returns {number[]} 2 = static, 1 = {param}, 0 = {...rest}
 */
function segmentKinds(key) {
    return normalizePath(key)
        .split("/")
        .slice(1)
        .map((seg) => {
            const m = seg.match(/^\{([^/}]+)\}$/);
            if (!m) return 2;
            return m[1].startsWith("...") ? 0 : 1;
        });
}

/**
 * Specificity comparator for route templates: most specific first.
 * 1) per-position segment kind (static > {param} > {...rest}), left to right
 * 2) more segments first when one template is a shape-prefix of the other
 *    (so "/rest/{...rest}/last" outranks "/rest/{...rest}")
 * 3) ascending raw-key comparison for determinism
 * Sorting by raw string length is wrong: "/pages/{slug}" (13 chars) would
 * shadow the more specific "/pages/query" (12 chars).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareRouteSpecificity(a, b) {
    const ka = segmentKinds(a);
    const kb = segmentKinds(b);
    const n = Math.min(ka.length, kb.length);
    for (let i = 0; i < n; i++) {
        if (ka[i] !== kb[i]) return kb[i] - ka[i];
    }
    if (ka.length !== kb.length) return kb.length - ka.length;
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @typedef {{ key: string, out: string, regex: RegExp, names: string[] }} CompiledEntry
 */

/**
 * Per-language compiled matchers, built lazily and cached. ROUTE_SLUGS is
 * immutable module data, so this is pure and safe to share across requests.
 * Each direction is sorted by the shape of the side being MATCHED:
 * - byCanonical: regex over the canonical key, emits the localized template
 * - byLocalized: regex over the localized template, emits the canonical key
 * @type {Map<string, { byCanonical: CompiledEntry[], byLocalized: CompiledEntry[] }>}
 */
const COMPILED = new Map();

/** @param {string} lang */
function compiledFor(lang) {
    let c = COMPILED.get(lang);
    if (!c) {
        const entries = Object.entries(ROUTE_SLUGS[lang] || {});
        /** @param {string} key @param {string} out @returns {CompiledEntry} */
        const compile = (key, out) => ({ key, out, ...buildKeyRegex(key) });
        c = {
            byCanonical: entries
                .map(([canonical, localized]) => compile(canonical, localized))
                .sort((x, y) => compareRouteSpecificity(x.key, y.key)),
            byLocalized: entries
                .map(([canonical, localized]) => compile(localized, canonical))
                .sort((x, y) => compareRouteSpecificity(x.key, y.key)),
        };
        COMPILED.set(lang, c);
    }
    return c;
}

/**
 * First (most specific) entry whose regex matches wins.
 * @param {CompiledEntry[]} list
 * @param {string} p normalized pathname
 * @returns {{ base: string, matchedLength: number } | null}
 */
function matchAgainst(list, p) {
    for (const { regex, names, out } of list) {
        const m = p.match(regex);
        if (!m) continue;
        const values = Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
        return { base: applyTemplate(out, values), matchedLength: m[0].length };
    }
    return null;
}

/**
 * Convert a canonical (EN) path to a localized path for a language.
 * Preserves placeholder values, remainder segments and any query/hash.
 * @param {string} canonicalPath
 * @param {string} lang
 * @returns {string}
 */
export function toLocalized(canonicalPath, lang) {
    const { pathname, suffix } = splitPath(canonicalPath);
    const map = ROUTE_SLUGS[lang || DEFAULT_LANG] || {};

    // A placeholder pattern string itself maps via direct lookup
    if (/{[^}]+}/.test(pathname) && map[pathname]) {
        return normalizePath(map[pathname]) + suffix;
    }

    const match = matchAgainst(
        compiledFor(lang || DEFAULT_LANG).byCanonical,
        pathname
    );
    if (!match) return pathname + suffix; // no mapping -> canonical equals localized

    const rest = pathname.slice(match.matchedLength);
    return normalizePath(normalizePath(match.base) + rest) + suffix;
}

/**
 * Convert a localized path to its canonical (EN) path for a language.
 * Preserves placeholder values, remainder segments and any query/hash.
 * @param {string} localizedPath
 * @param {string} lang
 * @returns {string}
 */
export function toCanonical(localizedPath, lang) {
    const { pathname, suffix } = splitPath(localizedPath);

    const match = matchAgainst(
        compiledFor(lang || DEFAULT_LANG).byLocalized,
        pathname
    );
    if (!match) return pathname + suffix; // no mapping -> already canonical

    const rest = pathname.slice(match.matchedLength);
    return normalizePath(normalizePath(match.base) + rest) + suffix;
}

/**
 * Validate that a localized path is valid for a given language:
 * 1) paths claimed by this language's localized templates must round-trip
 *    exactly (rejects half-translated shapes like "/strani/query"),
 * 2) paths matching another language's non-identity localized template are
 *    foreign and rejected (e.g. "/seiten/abfrage" under sl or en),
 * 3) remaining paths must not have a localized home in this language
 *    (rejects canonical "/pages/query" under sl, where "/strani/poizvedba"
 *    is the real URL); unmapped paths pass and unknown routes still 404
 *    at route matching.
 * @param {string} localizedPath
 * @param {string} lang
 * @returns {boolean}
 */
export function isValidLocalizedPath(localizedPath, lang) {
    const { pathname: p } = splitPath(localizedPath);
    if (p === "/") return true;
    const l = lang || DEFAULT_LANG;

    if (matchAgainst(compiledFor(l).byLocalized, p)) {
        const roundTrip = toLocalized(toCanonical(p, l), l);
        return normalizePath(roundTrip) === p;
    }

    for (const otherLang of SUPPORTED_LANGS) {
        if (otherLang === l) continue;
        for (const entry of compiledFor(otherLang).byLocalized) {
            // identity mappings (localized === canonical) carry no foreign
            // signal and must not poison other languages
            if (entry.key === entry.out) continue;
            if (entry.regex.test(p)) return false;
        }
    }

    // unclaimed by any localized template: valid only if this language
    // would not localize it elsewhere
    return normalizePath(toLocalized(p, l)) === p;
}

/**
 * Build a target URL for switching language.
 * - Detect and strip an existing language prefix if present
 * - Convert to canonical, then to the target language
 * - Apply prefix rule (no prefix for default, prefix for others)
 * - Preserve query string and hash
 *
 * @param {string} currentHref Full current path (pathname + optional query/hash) or just pathname.
 * @param {string | undefined} fromLang Explicit source language; pass undefined to detect from prefix.
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
