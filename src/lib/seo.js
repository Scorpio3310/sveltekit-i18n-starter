// Canonical paths of [lang=lang] pages excluded from indexing.
// Single source of truth: +page.js files derive their `noindex` flag from it
// (via route id) and sitemap.xml/+server.js filters these pages out.

/** @type {Set<string>} */
export const NOINDEXED_PAGES = new Set(["/playground/api", "/playground/i18n"]);

/**
 * Whether the page at a [lang=lang] route id is excluded from indexing.
 * @param {string | null} routeId e.g. "/[lang=lang]/playground/api"
 */
export function isNoindexed(routeId) {
    const canonical = (routeId ?? "").replace("/[lang=lang]", "") || "/";
    return NOINDEXED_PAGES.has(canonical);
}
