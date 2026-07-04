import { redirect } from "@sveltejs/kit";
import { SUPPORTED_LANGS } from "$i18n/languages.js";
import { DEFAULT_LANG, PREFIX_DEFAULT, toCanonical } from "$i18n/routing.js";
import { translatorFor, localeForIntl } from "$i18n/i18n.js";
import { negotiateLanguage } from "$i18n/negotiate.js";
import { isKnownCanonicalPath } from "./hooks.js";

/** Cookie remembering the visitor's language choice (see root "/" handling). */
const LANG_COOKIE = "lang";
const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Coerce an internal redirect target to a same-origin path. `event.url`
 * properties are attacker-controlled, and a value like "//evil.com" would be
 * treated by the browser as a protocol-relative URL (open redirect). Collapse
 * leading slashes so the target is always rooted at this origin.
 * @param {string} path
 * @returns {string}
 */
function safeLocalPath(path) {
    return "/" + path.replace(/^\/+/, "");
}

/**
 * The visitor's preferred language: an explicit earlier choice (cookie) wins,
 * then the browser's Accept-Language. Returns null when neither yields a
 * supported language.
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {string | null}
 */
function preferredLanguage(event) {
    const cookieLang = event.cookies.get(LANG_COOKIE);
    if (cookieLang && SUPPORTED_LANGS.includes(cookieLang)) return cookieLang;
    return negotiateLanguage(
        event.request.headers.get("accept-language"),
        SUPPORTED_LANGS
    );
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const pathname = event.url.pathname;
    const search = event.url.search || "";
    const seg = pathname.split("/").filter(Boolean)[0];
    const isPrefixed = !!seg && SUPPORTED_LANGS.includes(seg);
    const isKnownDefaultPage =
        !isPrefixed &&
        isKnownCanonicalPath(toCanonical(pathname, DEFAULT_LANG));

    // Language resolution:
    // - "/<lang>/..."         -> the URL's language wins
    // - known default page    -> DEFAULT_LANG (that IS the page's language)
    // - anything else (a 404) -> the visitor's language, so error pages match
    //   what they were browsing (e.g. /de1 stays German if they came from /de)
    const lang = isPrefixed
        ? seg
        : isKnownDefaultPage
          ? DEFAULT_LANG
          : (preferredLanguage(event) ?? DEFAULT_LANG);
    const pathWithoutPrefix = isPrefixed
        ? pathname.slice((`/` + seg).length) || "/"
        : pathname;

    if (pathname === "/") {
        // Language detection happens ONLY here (deep URLs stay stable for
        // SEO). 302, not 308 — the target varies per visitor.
        const preferred = preferredLanguage(event);
        if (preferred && preferred !== DEFAULT_LANG) {
            redirect(302, `/${preferred}${search}`);
        }
        if (PREFIX_DEFAULT) {
            redirect(302, `/${DEFAULT_LANG}${search}`);
        }
    } else if (!isPrefixed && PREFIX_DEFAULT) {
        // Prefix mode: canonicalize unprefixed URLs to '/<DEFAULT_LANG>/...'
        // (308 = permanent, method-preserving). Without this, the reroute
        // hook would serve the same page on both URLs (duplicate content).
        if (isKnownCanonicalPath(toCanonical(pathname, DEFAULT_LANG))) {
            redirect(308, `/${DEFAULT_LANG}${pathname}${search}`);
        }
    }

    if (isPrefixed && lang === DEFAULT_LANG && !PREFIX_DEFAULT) {
        // Non-prefix mode: strip the default-language prefix
        // (the URL fragment never reaches the server, so only search survives)
        redirect(308, safeLocalPath(`${pathWithoutPrefix}${search}`));
    }

    // Remember the visited language so the next visit to "/" honours it
    // (switching languages in the navbar lands on a localized URL, which
    // refreshes the cookie — an explicit choice). Only localized PAGES set
    // the cookie: endpoints/assets (/robots.txt, /sitemap.xml, /external) and
    // 404s must not overwrite the visitor's choice.
    const isLocalizedPage = isPrefixed || isKnownDefaultPage;
    if (isLocalizedPage && event.cookies.get(LANG_COOKIE) !== lang) {
        event.cookies.set(LANG_COOKIE, lang, {
            path: "/",
            maxAge: LANG_COOKIE_MAX_AGE,
            sameSite: "lax",
        });
    }

    // Note: localized-path validation lives in
    // src/routes/[lang=lang]/+layout.server.js — an error() thrown there
    // renders the translated +error.svelte, while errors thrown in handle
    // would only render the bare fallback error page.

    // Expose helpers
    event.locals.lang = lang;
    event.locals.intlLocale = localeForIntl(lang);
    event.locals.t = await translatorFor(lang);

    return resolve(event, {
        transformPageChunk: ({ html }) =>
            typeof html === "string" ? html.replace("%html-lang%", lang) : html,
    });
}
