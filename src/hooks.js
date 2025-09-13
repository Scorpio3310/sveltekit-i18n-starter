// Reroute only for pages that exist under routes/[lang=lang].
// Leave non-localized root-level endpoints and unrelated pages untouched.

import { DEFAULT_LANG, toCanonical, toLocalized } from "./i18n/routing";
import { SUPPORTED_LANGS } from "./i18n/languages";

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
    let path = file
        .replace(/^\.\/routes\/[^[\]]*\[lang=lang\]/, "")
        .replace(/\/\+(?:page|server)\.[a-z]+$/, "");
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

const CANONICAL_REGEXES = Object.keys(pageFiles).map(fileToRegex);

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

    // Skip files with extension (e.g., /robots.txt, /favicon.ico)
    const last = pathname.split("/").pop();
    if (last && /\.[\w.-]+$/.test(last)) return;

    const seg = pathname.split("/").filter(Boolean)[0];
    if (seg && SUPPORTED_LANGS.includes(seg)) {
        const rest = normalize(pathname.slice(("/" + seg).length) || "/");
        const canonical = toCanonical(rest, seg);
        const isKnown = CANONICAL_REGEXES.some((rx) => rx.test(canonical));
        if (!isKnown) return; // let it 404 naturally
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
    const matchesCanonical = CANONICAL_REGEXES.some((rx) =>
        rx.test(canonicalFromDefault)
    );
    if (!matchesCanonical) return; // not a known [lang=lang] page; leave as-is

    // Internally resolve to the default language branch
    return `/${DEFAULT_LANG}${
        canonicalFromDefault === "/" ? "" : canonicalFromDefault
    }`;
}
