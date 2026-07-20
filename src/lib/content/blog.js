// Blog content collection: markdown posts compiled by mdsvex.
//
// Layout mirrors the Astro i18n starter: one folder per language, the file
// name IS that language's URL slug, and translations of the same article
// declare a shared `linkedContent` key in their frontmatter:
//
//   src/lib/content/blog/en/ai-in-education.md      linkedContent: "ai-in-education"
//   src/lib/content/blog/sl/ui-v-izobrazevanju.md   linkedContent: "ai-in-education"
//   src/lib/content/blog/de/ki-in-der-bildung.md    linkedContent: "ai-in-education"
//
// From that key this module derives the slug map that powers per-post
// language switching, hreflang alternates and the sitemap. A post may be
// missing in some languages (partial translation) — consumers must handle
// an alternates map that doesn't cover every supported language.
// blog.test.js guards the collection against typos in linkedContent keys.

import { translatePathFor } from "$i18n/i18n";

/** Posts per blog index page. */
export const PAGE_SIZE = 3;

// Lazy loaders so a language's posts ship in their own chunks (same idea as
// the per-language dictionaries in i18n.js). `metadata` is the frontmatter
// export mdsvex generates; the second glob imports just that.
const postModules = import.meta.glob("./blog/*/*.md");
const metaModules = import.meta.glob("./blog/*/*.md", { import: "metadata" });

/**
 * @typedef {Object} PostMeta
 * @property {string} slug URL slug in this post's language (the file name)
 * @property {string} lang
 * @property {string} title
 * @property {string} description
 * @property {string} linkedContent shared key linking translations
 * @property {string} pubDate ISO date string
 * @property {string} [author]
 * @property {boolean} [isDraft]
 */

/** @param {string} path glob path "./blog/<lang>/<slug>.md" */
function parsePath(path) {
    const m = path.match(/^\.\/blog\/([^/]+)\/([^/]+)\.md$/);
    return m ? { lang: m[1], slug: m[2] } : null;
}

/**
 * Published posts of one language, newest first.
 * @param {string} lang
 * @returns {Promise<PostMeta[]>}
 */
export async function postsFor(lang) {
    const entries = Object.entries(metaModules).filter(
        ([path]) => parsePath(path)?.lang === lang
    );

    const posts = await Promise.all(
        entries.map(async ([path, load]) => {
            const meta = /** @type {Omit<PostMeta, 'slug' | 'lang'>} */ (
                await load()
            );
            const { slug } = /** @type {{ slug: string }} */ (parsePath(path));
            return { slug, lang, ...meta };
        })
    );

    return posts
        .filter((p) => !p.isDraft)
        .sort(
            (a, b) =>
                Date.parse(b.pubDate) - Date.parse(a.pubDate) ||
                a.slug.localeCompare(b.slug)
        );
}

/**
 * A single post by language and slug, or null when it doesn't exist in that
 * language (which includes another language's slug — each file lives in
 * exactly one language folder, so foreign slugs 404 naturally).
 * @param {string} lang
 * @param {string} slug
 * @returns {Promise<{ metadata: PostMeta, component: import('svelte').Component } | null>}
 */
export async function resolvePost(lang, slug) {
    const load = postModules[`./blog/${lang}/${slug}.md`];
    if (!load) return null;
    const mod = /** @type {any} */ (await load());
    if (mod.metadata?.isDraft) return null;
    return {
        metadata: { slug, lang, ...mod.metadata },
        component: mod.default,
    };
}

/** @type {Promise<Record<string, Record<string, string>>> | undefined} */
let mapPromise;

/**
 * linkedContent key -> { lang: slug } for every published post. Cached —
 * content is static per build. Loading it touches every post's metadata, so
 * call it server-side (alternates, sitemap, RSS), not from the client.
 */
export function linkedContentMap() {
    return (mapPromise ??= buildLinkedContentMap());
}

async function buildLinkedContentMap() {
    /** @type {Record<string, Record<string, string>>} */
    const map = {};
    for (const [path, load] of Object.entries(metaModules)) {
        const parsed = parsePath(path);
        if (!parsed) continue;
        const meta = /** @type {any} */ (await load());
        if (meta.isDraft || !meta.linkedContent) continue;
        (map[meta.linkedContent] ??= {})[parsed.lang] = parsed.slug;
    }
    return map;
}

/**
 * Localized URLs of a post's existing translations, keyed by language:
 * { en: "/blog/ai-in-education", sl: "/sl/blog/ui-v-izobrazevanju", ... }.
 * Languages without a translation are absent from the result.
 * @param {string} lang
 * @param {string} slug
 * @returns {Promise<Record<string, string> | null>} null if the post is unknown
 */
export async function alternatesFor(lang, slug) {
    const map = await linkedContentMap();
    const key = Object.keys(map).find((k) => map[k][lang] === slug);
    if (!key) return null;
    return Object.fromEntries(
        Object.entries(map[key]).map(([l, s]) => [
            l,
            translatePathFor(`/blog/${s}`, l),
        ])
    );
}

/**
 * One page of a post list.
 * @template T
 * @param {T[]} posts
 * @param {number} page 1-based
 * @returns {{ items: T[], page: number, totalPages: number }}
 */
export function paginate(posts, page) {
    const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
    return {
        items: posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        page,
        totalPages,
    };
}
