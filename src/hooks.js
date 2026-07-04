// Reroute only for pages that exist under routes/[lang=lang].
// Leave non-localized root-level endpoints and unrelated pages untouched.

import { DEFAULT_LANG, toCanonical, toLocalized } from "$i18n/routing";
import { SUPPORTED_LANGS } from "$i18n/languages";

/** Build canonical regexes from the [lang=lang] pages on disk. */
const pageFiles = import.meta.glob(
    "./routes/[lang=lang]/**/+{page,server}.{svelte,js,ts}",
    { eager: false }
);

/**
 * Convert a file path like './routes/[lang=lang]/news/[slug]/+page.svelte'
 * into a canonical regex like ^/news/([^/]+)$ and ^/news(?:/.*)?$ for directories.
 * @param {string} file
 */
function fileToRegex(file) {
    const path = fileToCanonicalDir(file);
    if (path === "") return /^\/$/; // home

    const segs = path.split("/").filter(Boolean);
    const pattern = segs
        .map((s) =>
            s === "[...rest]"
                ? ".+"
                : s.startsWith("[") && s.endsWith("]")
                ? "[^/]+"
                : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        )
        .join("/");
    return new RegExp(`^/${pattern}(?:$|/)`);
}

/** @param {string} file */
function fileToCanonicalDir(file) {
    return file
        .replace(/^\.\/routes\/[^[\]]*\[lang=lang\]/, "")
        .replace(/\/\+(?:page|server)\.[a-z]+$/, "");
}

const CANONICAL_REGEXES = Object.keys(pageFiles).map(fileToRegex);

/**
 * Canonical paths of all static (parameter-free) [lang=lang] pages.
 * Used by the sitemap endpoint; parameterised routes can't be enumerated
 * without data and are omitted.
 * @type {string[]}
 */
export const STATIC_CANONICAL_PAGES = [
    ...new Set(
        Object.keys(pageFiles)
            .filter((f) => /\/\+page\.(svelte|js|ts)$/.test(f))
            .map(fileToCanonicalDir)
            .filter((p) => !p.includes("["))
            .map((p) => p || "/")
    ),
].sort();

/**
 * Whether a canonical path belongs to a page/endpoint under [lang=lang].
 * @param {string} canonicalPath
 */
export function isKnownCanonicalPath(canonicalPath) {
    return CANONICAL_REGEXES.some((rx) => rx.test(canonicalPath));
}

/** Normalize path */
function normalize(p) {
    if (!p) return "/";
    let s = p.startsWith("/") ? p : "/" + p;
    if (s !== "/") s = s.replace(/\/+$/g, "");
    return s || "/";
}

/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
    let pathname = normalize(url.pathname);

    const seg = pathname.split("/").filter(Boolean)[0];
    if (seg && SUPPORTED_LANGS.includes(seg)) {
        const rest = normalize(pathname.slice(("/" + seg).length) || "/");
        const canonical = toCanonical(rest, seg);
        if (!isKnownCanonicalPath(canonical)) return; // let it 404 naturally
        // Normalize internal path to the canonical page within the lang branch
        return `/${seg}${canonical === "/" ? "" : canonical}`;
    }

    // Not prefixed: compute canonical from current default language (supports localized default slugs)
    const canonicalFromDefault = toCanonical(pathname, DEFAULT_LANG);
    const localizedForDefault = toLocalized(canonicalFromDefault, DEFAULT_LANG);
    // If a mapping exists and the requested root path is the canonical (not the localized), block it (404)
    if (
        localizedForDefault !== canonicalFromDefault &&
        pathname === canonicalFromDefault
    ) {
        return; // cause normal 404 at root for canonical when a localized slug exists
    }
    if (!isKnownCanonicalPath(canonicalFromDefault)) return; // not a known [lang=lang] page; leave as-is

    // Internally resolve to the default language branch
    return `/${DEFAULT_LANG}${
        canonicalFromDefault === "/" ? "" : canonicalFromDefault
    }`;
}
