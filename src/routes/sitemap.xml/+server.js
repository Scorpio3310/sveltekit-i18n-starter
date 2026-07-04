import { STATIC_CANONICAL_PAGES } from "../../hooks.js";
import { translatePathFor } from "$i18n/i18n";
import { SUPPORTED_LANGS } from "$i18n/languages";
import { DEFAULT_LANG } from "$i18n/routing";

// Pages marked `noindex: true` in their +page.js — keep the two lists in sync.
const NOINDEXED = new Set(["/playground/api", "/playground/i18n"]);

/**
 * Per-language sitemap with hreflang alternates for every static
 * [lang=lang] page. Parameterised routes ([slug], [...rest]) are omitted —
 * enumerate them here once real data exists.
 * @type {import('./$types').RequestHandler}
 */
export function GET({ url }) {
    const pages = STATIC_CANONICAL_PAGES.filter((p) => !NOINDEXED.has(p));

    const urls = pages
        .flatMap((canonical) => {
            const alternates = SUPPORTED_LANGS.map((lang) => ({
                lang,
                href: url.origin + translatePathFor(canonical, lang),
            }));
            const links = [
                ...alternates.map(
                    (a) =>
                        `<xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`
                ),
                `<xhtml:link rel="alternate" hreflang="x-default" href="${
                    url.origin + translatePathFor(canonical, DEFAULT_LANG)
                }"/>`,
            ].join("\n            ");
            return alternates.map(
                (a) =>
                    `    <url>\n        <loc>${a.href}</loc>\n            ${links}\n    </url>`
            );
        })
        .join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

    return new Response(body, {
        headers: { "Content-Type": "application/xml" },
    });
}
