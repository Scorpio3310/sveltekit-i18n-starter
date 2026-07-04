import { error } from "@sveltejs/kit";
import { isValidLocalizedPath } from "$i18n/routing";

/**
 * Validate localized paths here rather than in the handle hook: an error()
 * thrown from a load renders the translated +error.svelte inside the layout,
 * while errors thrown in handle only produce the bare fallback error page.
 *
 * `url.pathname` is the original requested URL (reroute only changes route
 * matching), so the language prefix — when present — is stripped first.
 * Unprefixed URLs reach this load via reroute for the default language.
 * @type {import('./$types').LayoutServerLoad}
 */
export function load({ url, params }) {
    const prefix = `/${params.lang}`;
    const pathWithoutPrefix =
        url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
            ? url.pathname.slice(prefix.length) || "/"
            : url.pathname;

    if (!isValidLocalizedPath(pathWithoutPrefix, params.lang)) {
        error(404, "Not found");
    }

    return {};
}
