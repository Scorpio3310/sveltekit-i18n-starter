// Per-language RSS 2.0 feed built from the blog content collection.
// Lives under [lang=lang], so the existing reroute hook serves it at
// /rss.xml (default language) and /<lang>/rss.xml for the others.
import { postsFor } from "$lib/content/blog";
import { localeForIntl, translatePathFor, translatorFor } from "$i18n/i18n";

/** @param {string} value */
function escapeXml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, url }) {
    const lang = params.lang;
    const t = await translatorFor(lang);
    const posts = await postsFor(lang);

    const selfUrl = url.origin + translatePathFor("/rss.xml", lang);
    const blogUrl = url.origin + translatePathFor("/blog", lang);

    const items = posts
        .map((post) => {
            const link =
                url.origin + translatePathFor(`/blog/${post.slug}`, lang);
            return `        <item>
            <title>${escapeXml(post.title)}</title>
            <link>${link}</link>
            <guid isPermaLink="true">${link}</guid>
            <description>${escapeXml(post.description)}</description>
            <pubDate>${new Date(post.pubDate).toUTCString()}</pubDate>
        </item>`;
        })
        .join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${escapeXml(`${t("home.head.title")} — ${t("blog.head.title")}`)}</title>
        <link>${blogUrl}</link>
        <description>${escapeXml(t("blog.head.description"))}</description>
        <language>${localeForIntl(lang).toLowerCase()}</language>
        <atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>
${items}
    </channel>
</rss>`;

    return new Response(body, {
        headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
}
