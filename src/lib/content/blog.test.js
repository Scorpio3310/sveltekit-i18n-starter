// Consistency guard for the blog content collection. The linkedContent
// mechanism has one failure mode: a typo in the key silently unlinks a
// translation. These tests catch that, plus missing frontmatter and
// duplicate keys, at `pnpm test` time instead of in production.
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("$env/dynamic/public", () => ({
    env: {
        PUBLIC_DEFAULT_LOCALE: "en",
        PUBLIC_PREFIX_DEFAULT_LOCALE: "false",
    },
}));

import { SUPPORTED_LANGS } from "$i18n/languages";

// Raw frontmatter of every post, keyed by "./blog/<lang>/<slug>.md".
const allMeta = import.meta.glob("./blog/*/*.md", {
    import: "metadata",
    eager: true,
});

/** @type {typeof import('./blog.js')} */
let blog;

beforeAll(async () => {
    blog = await import("./blog.js");
});

describe("content collection consistency", () => {
    const entries = Object.entries(allMeta).map(([path, meta]) => {
        const [, lang, slug] =
            path.match(/^\.\/blog\/([^/]+)\/([^/]+)\.md$/) ?? [];
        return { path, lang, slug, meta: /** @type {any} */ (meta) };
    });

    it("collects posts from every supported language folder only", () => {
        expect(entries.length).toBeGreaterThan(0);
        for (const { path, lang } of entries) {
            expect(SUPPORTED_LANGS, `unexpected folder in ${path}`).toContain(
                lang
            );
        }
    });

    it("every post has the required frontmatter", () => {
        for (const { path, meta } of entries) {
            expect(meta.title, `title missing in ${path}`).toBeTruthy();
            expect(
                meta.description,
                `description missing in ${path}`
            ).toBeTruthy();
            expect(
                meta.linkedContent,
                `linkedContent missing in ${path}`
            ).toBeTruthy();
            expect(
                Number.isNaN(Date.parse(meta.pubDate)),
                `pubDate invalid in ${path}`
            ).toBe(false);
        }
    });

    it("linkedContent keys are unique within each language", () => {
        /** @type {Map<string, string>} */
        const seen = new Map();
        for (const { path, lang, meta } of entries) {
            const id = `${lang}:${meta.linkedContent}`;
            expect(
                seen.has(id),
                `${path} reuses ${id} already used by ${seen.get(id)}`
            ).toBe(false);
            seen.set(id, path);
        }
    });

    it("every linkedContent key has a default-language original", () => {
        const enKeys = new Set(
            entries
                .filter((e) => e.lang === "en")
                .map((e) => e.meta.linkedContent)
        );
        for (const { path, meta } of entries) {
            expect(
                enKeys.has(meta.linkedContent),
                `${path} links "${meta.linkedContent}" which has no en original — typo?`
            ).toBe(true);
        }
    });
});

describe("postsFor", () => {
    it("returns published posts newest-first", async () => {
        const posts = await blog.postsFor("en");
        expect(posts.length).toBe(5);
        const dates = posts.map((p) => Date.parse(p.pubDate));
        expect(dates).toEqual([...dates].sort((a, b) => b - a));
        expect(posts[0].slug).toBe("ai-in-education");
    });

    it("reflects partial translation (de has one post fewer)", async () => {
        expect((await blog.postsFor("de")).length).toBe(4);
        expect((await blog.postsFor("sl")).length).toBe(5);
    });
});

describe("resolvePost", () => {
    it("resolves a post to metadata plus a renderable component", async () => {
        const post = await blog.resolvePost("sl", "ui-v-izobrazevanju");
        expect(post?.metadata.linkedContent).toBe("ai-in-education");
        expect(post?.metadata.title).toContain("UI v izobra");
        expect(post?.component).toBeTypeOf("function");
    });

    it("returns null for unknown and foreign-language slugs", async () => {
        expect(await blog.resolvePost("en", "no-such-post")).toBeNull();
        expect(await blog.resolvePost("de", "ui-v-izobrazevanju")).toBeNull();
    });
});

describe("alternatesFor", () => {
    it("maps a fully translated post to real per-language slugs", async () => {
        expect(await blog.alternatesFor("sl", "ui-v-izobrazevanju")).toEqual({
            en: "/blog/ai-in-education",
            sl: "/sl/blog/ui-v-izobrazevanju",
            de: "/de/blog/ki-in-der-bildung",
        });
    });

    it("omits languages without a translation", async () => {
        const alternates = await blog.alternatesFor(
            "en",
            "design-systems-2025"
        );
        expect(alternates).toEqual({
            en: "/blog/design-systems-2025",
            sl: "/sl/blog/oblikovalski-sistemi-2025",
        });
        expect(alternates?.de).toBeUndefined();
    });

    it("returns null for an unknown post", async () => {
        expect(await blog.alternatesFor("en", "no-such-post")).toBeNull();
    });
});

describe("paginate", () => {
    it("splits into PAGE_SIZE pages and clamps totals", () => {
        const items = ["a", "b", "c", "d", "e"];
        expect(blog.paginate(items, 1)).toEqual({
            items: ["a", "b", "c"],
            page: 1,
            totalPages: 2,
        });
        expect(blog.paginate(items, 2).items).toEqual(["d", "e"]);
        expect(blog.paginate([], 1)).toEqual({
            items: [],
            page: 1,
            totalPages: 1,
        });
    });
});
