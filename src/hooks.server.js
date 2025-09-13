import { error, redirect } from "@sveltejs/kit";
import { SUPPORTED_LANGS } from "./i18n/languages.js";
import {
    DEFAULT_LANG,
    isValidLocalizedPath,
    PREFIX_DEFAULT,
} from "./i18n/routing.js";
import { makeT, localeForIntl } from "./i18n/i18n.js";

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const pathname = event.url.pathname;
    const seg = pathname.split("/").filter(Boolean)[0];
    const isPrefixed = !!seg && SUPPORTED_LANGS.includes(seg);

    const lang = isPrefixed ? seg : DEFAULT_LANG;
    const pathWithoutPrefix = isPrefixed
        ? pathname.slice((`/` + seg).length) || "/"
        : pathname;

    // Redirect root to '/<DEFAULT_LANG>' when prefix mode is enabled
    if (!isPrefixed && pathname === "/" && PREFIX_DEFAULT) {
        redirect(307, `/${DEFAULT_LANG}`);
    }

    // Default language prefix handling
    if (isPrefixed && lang === DEFAULT_LANG) {
        if (!PREFIX_DEFAULT) {
            // strip default prefix in non-prefixed mode
            const target = `${pathWithoutPrefix}${event.url.search || ""}${
                event.url.hash || ""
            }`;
            redirect(307, target);
        }
        // else: allow prefixed default language
    }

    // Validate only under '/<lang>/...'
    if (isPrefixed) {
        const ok = isValidLocalizedPath(pathWithoutPrefix, lang);
        if (!ok) error(404, "Not found");
    }

    // Expose helpers
    event.locals.lang = lang;
    event.locals.intlLocale = localeForIntl(lang);
    event.locals.t = makeT(lang);
    event.locals.i18n = { lang, intlLocale: event.locals.intlLocale };

    return resolve(event, {
        transformPageChunk: ({ html }) =>
            typeof html === "string" ? html.replace("%html-lang%", lang) : html,
    });
}
