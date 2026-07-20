import { STATIC_CANONICAL_PAGES } from "../../hooks.js";
import { NOINDEXED_PAGES } from "$lib/seo";
import { linkedContentMap } from "$lib/content/blog";
import { translatePathFor } from "$i18n/i18n";
import { SUPPORTED_LANGS } from "$i18n/languages";
import { DEFAULT_LANG } from "$i18n/routing";

/**
 * Render one <url> entry per alternate, each carrying the full hreflang set.
 * @param {{ lang: string, href: string }[]} alternates
 * @param {string | undefined} xDefaultHref
 */
function urlEntries(alternates, xDefaultHref) {
    const links = [
        ...alternates.map(
            (a) =>
                `<xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`
        ),
        ...(xDefaultHref
            ? [
                  `<xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultHref}"/>`,
              ]
            : []),
    ].join("\n            ");
    return alternates.map(
        (a) =>
            `    <url>\n        <loc>${a.href}</loc>\n            ${links}\n    </url>`
    );
}

/**
 * Per-language sitemap with hreflang alternates for every static
 * [lang=lang] page and every blog post. Post URLs use each language's real
 * slug from the content collection; partially translated posts emit
 * alternates only for the languages they exist in. Pagination pages
 * (/blog/page/N) are deliberately omitted.
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ url }) {
    const pages = STATIC_CANONICAL_PAGES.filter((p) => !NOINDEXED_PAGES.has(p));

    const pageUrls = pages.flatMap((canonical) => {
        const alternates = SUPPORTED_LANGS.map((lang) => ({
            lang,
            href: url.origin + translatePathFor(canonical, lang),
        }));
        return urlEntries(
            alternates,
            url.origin + translatePathFor(canonical, DEFAULT_LANG)
        );
    });

    const posts = await linkedContentMap();
    const postUrls = Object.values(posts).flatMap((slugs) => {
        const alternates = SUPPORTED_LANGS.filter((lang) => slugs[lang]).map(
            (lang) => ({
                lang,
                href:
                    url.origin + translatePathFor(`/blog/${slugs[lang]}`, lang),
            })
        );
        const xDefault = slugs[DEFAULT_LANG]
            ? url.origin +
              translatePathFor(`/blog/${slugs[DEFAULT_LANG]}`, DEFAULT_LANG)
            : undefined;
        return urlEntries(alternates, xDefault);
    });

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...pageUrls, ...postUrls].join("\n")}
</urlset>`;

    return new Response(body, {
        headers: { "Content-Type": "application/xml" },
    });
}
