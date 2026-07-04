import { pathnameOf } from "$i18n/routing";

/**
 * Safely read current pathname from the browser (no SSR crash).
 *
 * @returns {string}
 */
function currentPathnameSafe() {
    try {
        // use globalThis to avoid reference errors in SSR
        const loc = /** @type {any} */ (globalThis)?.location;
        const path = typeof loc?.pathname === "string" ? loc.pathname : "/";
        return pathnameOf(path);
    } catch {
        return "/";
    }
}

/**
 * Check whether a target path matches the current URL.
 *
 * - Exact mode: returns true only when paths are identical.
 * - Prefix mode (exactMatch=false): also matches when current starts with target on a segment boundary.
 *
 * Usage: pass `page.url.pathname` for `currentPath` when available to avoid SSR/window assumptions.
 *
 * @param {string} targetPath The path to check (e.g., translated link)
 * @param {string=} currentPath Current page pathname (e.g., `page.url.pathname`). If omitted, uses `window.location.pathname` in the browser.
 * @param {boolean=} exactMatch Whether to require exact match (default true)
 * @returns {boolean}
 */
export function isCurrentRoute(targetPath, currentPath, exactMatch = true) {
    const a = pathnameOf(targetPath);
    const b =
        typeof currentPath === "string"
            ? pathnameOf(currentPath)
            : currentPathnameSafe();
    if (exactMatch) return a === b;
    // ensure we only match as a full segment prefix (avoid '/pages' matching '/pages-xyz')
    if (b === a) return true;
    const aWithSlash = a.endsWith("/") ? a : a + "/";
    return b.startsWith(aWithSlash);
}
