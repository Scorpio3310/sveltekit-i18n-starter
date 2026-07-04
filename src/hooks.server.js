import { redirect } from "@sveltejs/kit";
import { SUPPORTED_LANGS } from "$i18n/languages.js";
import {
    DEFAULT_LANG,
    PREFIX_DEFAULT,
    toCanonical,
} from "$i18n/routing.js";
import { translatorFor, localeForIntl } from "$i18n/i18n.js";
import { isKnownCanonicalPath } from "./hooks.js";

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const pathname = event.url.pathname;
    const search = event.url.search || "";
    const seg = pathname.split("/").filter(Boolean)[0];
    const isPrefixed = !!seg && SUPPORTED_LANGS.includes(seg);

    const lang = isPrefixed ? seg : DEFAULT_LANG;
    const pathWithoutPrefix = isPrefixed
        ? pathname.slice((`/` + seg).length) || "/"
        : pathname;

    if (!isPrefixed && PREFIX_DEFAULT) {
        // Prefix mode: canonicalize unprefixed URLs to '/<DEFAULT_LANG>/...'
        // (308 = permanent, method-preserving). Without this, the reroute
        // hook would serve the same page on both URLs (duplicate content).
        if (pathname === "/") {
            redirect(308, `/${DEFAULT_LANG}${search}`);
        }
        if (isKnownCanonicalPath(toCanonical(pathname, DEFAULT_LANG))) {
            redirect(308, `/${DEFAULT_LANG}${pathname}${search}`);
        }
    }

    if (isPrefixed && lang === DEFAULT_LANG && !PREFIX_DEFAULT) {
        // Non-prefix mode: strip the default-language prefix
        // (the URL fragment never reaches the server, so only search survives)
        redirect(308, `${pathWithoutPrefix}${search}`);
    }

    // Note: localized-path validation lives in
    // src/routes/[lang=lang]/+layout.server.js — an error() thrown there
    // renders the translated +error.svelte, while errors thrown in handle
    // would only render the bare fallback error page.

    // Expose helpers
    event.locals.lang = lang;
    event.locals.intlLocale = localeForIntl(lang);
    event.locals.t = translatorFor(lang);

    return resolve(event, {
        transformPageChunk: ({ html }) =>
            typeof html === "string" ? html.replace("%html-lang%", lang) : html,
    });
}
