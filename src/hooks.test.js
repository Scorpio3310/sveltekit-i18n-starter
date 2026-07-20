// Unit tests for the universal reroute hook (PREFIX_DEFAULT=false).
// hooks.js discovers [lang=lang] pages via import.meta.glob, which vitest
// resolves through Vite, so the real route tree on disk is under test.
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("$env/dynamic/public", () => ({
    env: {
        PUBLIC_DEFAULT_LOCALE: "en",
        PUBLIC_PREFIX_DEFAULT_LOCALE: "false",
    },
}));

/** @type {typeof import('./hooks.js')} */
let hooks;

beforeAll(async () => {
    hooks = await import("./hooks.js");
});

/** @param {string} pathname */
function reroute(pathname) {
    return hooks.reroute(
        /** @type {any} */ ({ url: new URL(`http://localhost${pathname}`) })
    );
}

describe("reroute: prefixed localized URLs", () => {
    it("maps localized slugs onto the canonical [lang=lang] page", () => {
        expect(reroute("/sl/strani/poizvedba")).toBe("/sl/pages/query");
        expect(reroute("/de/seiten/abfrage")).toBe("/de/pages/query");
        expect(reroute("/sl")).toBe("/sl");
    });

    it("maps placeholder routes ({slug}, {...rest})", () => {
        expect(reroute("/sl/strani/moj-clanek")).toBe("/sl/pages/moj-clanek");
        expect(reroute("/de/beliebig/a/b/letzte")).toBe("/de/rest/a/b/last");
    });

    it("preserves percent-encoded slugs byte-for-byte", () => {
        expect(reroute("/sl/strani/%C5%A1umnik")).toBe("/sl/pages/%C5%A1umnik");
    });

    it("normalizes trailing slashes", () => {
        expect(reroute("/sl/strani/poizvedba/")).toBe("/sl/pages/query");
    });

    it("lets unknown prefixed paths 404 naturally", () => {
        expect(reroute("/sl/no-such-page")).toBeUndefined();
        expect(reroute("/de/strani/poizvedba")).toBeUndefined(); // wrong language's slug
    });
});

describe("reroute: unprefixed (default language) URLs", () => {
    it("resolves known pages into the default language branch", () => {
        expect(reroute("/")).toBe("/en");
        expect(reroute("/pages/query")).toBe("/en/pages/query");
        expect(reroute("/playground/i18n")).toBe("/en/playground/i18n");
    });

    it("leaves unknown paths and foreign slugs alone (404)", () => {
        expect(reroute("/no-such-page")).toBeUndefined();
        expect(reroute("/de1")).toBeUndefined(); // invalid language prefix
        expect(reroute("/strani/poizvedba")).toBeUndefined(); // sl slug at root
    });

    it("leaves root-level non-localized routes alone", () => {
        expect(reroute("/robots.txt")).toBeUndefined();
        expect(reroute("/sitemap.xml")).toBeUndefined();
        expect(reroute("/external")).toBeUndefined();
    });
});

describe("page discovery helpers", () => {
    it("isKnownCanonicalPath knows [lang=lang] pages and endpoints", () => {
        expect(hooks.isKnownCanonicalPath("/")).toBe(true);
        expect(hooks.isKnownCanonicalPath("/pages/query")).toBe(true);
        expect(hooks.isKnownCanonicalPath("/server/simple")).toBe(true);
        expect(hooks.isKnownCanonicalPath("/external")).toBe(false);
        expect(hooks.isKnownCanonicalPath("/nope")).toBe(false);
    });

    it("STATIC_CANONICAL_PAGES lists parameter-free pages only", () => {
        expect(hooks.STATIC_CANONICAL_PAGES).toContain("/");
        expect(hooks.STATIC_CANONICAL_PAGES).toContain("/pages/simple");
        expect(
            hooks.STATIC_CANONICAL_PAGES.every((p) => !p.includes("["))
        ).toBe(true);
    });
});
