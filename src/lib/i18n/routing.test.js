// Unit tests for localized-slug routing (PREFIX_DEFAULT=false).
// PREFIX_DEFAULT is baked in at module load, so env is set before the
// dynamic import; the prefixed variant lives in routing.prefixed.test.js.
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("$env/dynamic/public", () => ({
    env: {
        PUBLIC_DEFAULT_LOCALE: "en",
        PUBLIC_PREFIX_DEFAULT_LOCALE: "false",
    },
}));

/** @type {typeof import('./routing.js')} */
let routing;
/** @type {typeof import('./routes.js')} */
let routes;

beforeAll(async () => {
    routing = await import("./routing.js");
    routes = await import("./routes.js");
});

describe("specificity: static entries beat placeholder templates", () => {
    it("toLocalized prefers exact static mapping over {slug} (regression)", () => {
        expect(routing.toLocalized("/pages/query", "sl")).toBe(
            "/strani/poizvedba"
        );
        expect(routing.toLocalized("/pages/query", "de")).toBe(
            "/seiten/abfrage"
        );
        expect(routing.toLocalized("/pages/simple", "sl")).toBe(
            "/strani/enostavna"
        );
    });

    it("toCanonical prefers exact static mapping over {slug} (regression)", () => {
        expect(routing.toCanonical("/strani/poizvedba", "sl")).toBe(
            "/pages/query"
        );
        expect(routing.toCanonical("/seiten/abfrage", "de")).toBe(
            "/pages/query"
        );
    });

    it("static mapping beats {...rest} template (regression)", () => {
        expect(routing.toLocalized("/rest/dynamic", "sl")).toBe(
            "/poljubno/dinamicno"
        );
        expect(routing.toCanonical("/poljubno/dinamicno", "sl")).toBe(
            "/rest/dynamic"
        );
    });

    it("longer template beats its own shape-prefix", () => {
        // /rest/{...rest}/last must win over /rest/{...rest}
        expect(routing.toLocalized("/rest/a/b/last", "sl")).toBe(
            "/poljubno/a/b/zadnje"
        );
        expect(routing.toCanonical("/poljubno/a/b/zadnje", "sl")).toBe(
            "/rest/a/b/last"
        );
        expect(routing.toLocalized("/pages/abc/last", "sl")).toBe(
            "/strani/abc/zadnje"
        );
    });

    it("compareRouteSpecificity orders as documented", () => {
        const c = routing.compareRouteSpecificity;
        expect(c("/pages/query", "/pages/{slug}")).toBeLessThan(0);
        expect(c("/rest/dynamic", "/rest/{...rest}")).toBeLessThan(0);
        expect(c("/pages/{slug}/last", "/pages/{slug}")).toBeLessThan(0);
        expect(c("/rest/{...rest}/last", "/rest/{...rest}")).toBeLessThan(0);
        // deterministic tiebreak between disjoint statics ("q" < "s")
        expect(c("/pages/query", "/pages/simple")).toBeLessThan(0);
    });
});

describe("remainder and placeholder handling", () => {
    it("preserves remainder segments after the matched prefix", () => {
        expect(routing.toLocalized("/rest/dynamic/a/b/c", "sl")).toBe(
            "/poljubno/dinamicno/a/b/c"
        );
        expect(routing.toLocalized("/pages/simple/extra", "sl")).toBe(
            "/strani/enostavna/extra"
        );
    });

    it("passes through placeholder-pattern keys and unmapped paths", () => {
        expect(routing.toLocalized("/pages/{slug}", "sl")).toBe(
            "/strani/{slug}"
        );
        expect(routing.toLocalized("/external", "sl")).toBe("/external");
        // de has no "/server" mapping; boundary must not false-match /server/simple
        expect(routing.toLocalized("/server", "de")).toBe("/server");
    });

    it("round-trips every ROUTE_SLUGS entry (sl and de)", () => {
        for (const [lang, map] of Object.entries(routes.ROUTE_SLUGS)) {
            for (const canonicalKey of Object.keys(map)) {
                const concrete = canonicalKey
                    .replace(/\{\.\.\.[^}]+\}/g, "a/b/c")
                    .replace(/\{[^}]+\}/g, "abc");
                const localized = routing.toLocalized(concrete, lang);
                expect(routing.toCanonical(localized, lang)).toBe(concrete);
            }
        }
    });
});

describe("query strings, hashes and encoded paths", () => {
    it("matches static mappings even when a query string is attached", () => {
        expect(routing.toLocalized("/pages/simple?x=1", "sl")).toBe(
            "/strani/enostavna?x=1"
        );
        expect(routing.toLocalized("/pages/query?x=1&y=2", "sl")).toBe(
            "/strani/poizvedba?x=1&y=2"
        );
        expect(routing.toCanonical("/strani/poizvedba?x=1", "sl")).toBe(
            "/pages/query?x=1"
        );
    });

    it("keeps hash fragments intact", () => {
        expect(routing.toLocalized("/pages/simple#frag", "sl")).toBe(
            "/strani/enostavna#frag"
        );
    });

    it("preserves percent-encoding in dynamic slugs (no decode)", () => {
        // Matching is done on the raw encoded path and captures are emitted
        // verbatim, so SvelteKit's own decode pipeline handles them. A "%" or
        // "%2F" in a slug must survive untouched — decoding here would produce
        // "Malformed URI" (400) or a spurious segment split.
        expect(routing.toLocalized("/pages/50%25", "sl")).toBe("/strani/50%25");
        expect(routing.toCanonical("/strani/50%25", "sl")).toBe("/pages/50%25");
        expect(routing.toLocalized("/pages/a%2Fb", "sl")).toBe("/strani/a%2Fb");
        // encoded non-ASCII slug value round-trips byte-for-byte
        expect(routing.toCanonical("/strani/caf%C3%A9", "sl")).toBe(
            "/pages/caf%C3%A9"
        );
    });
});

describe("switchLanguageUrl", () => {
    it("switches localized paths across languages, preserving query/hash", () => {
        expect(
            routing.switchLanguageUrl(
                "/sl/strani/poizvedba?x=1#f",
                undefined,
                "de"
            )
        ).toBe("/de/seiten/abfrage?x=1#f");
        expect(
            routing.switchLanguageUrl(
                "/sl/strani/poizvedba?x=1#f",
                undefined,
                "en"
            )
        ).toBe("/pages/query?x=1#f");
        expect(
            routing.switchLanguageUrl("/pages/query?x=1", undefined, "sl")
        ).toBe("/sl/strani/poizvedba?x=1");
        expect(
            routing.switchLanguageUrl(
                "/sl/poljubno/a/b/zadnje",
                undefined,
                "de"
            )
        ).toBe("/de/beliebig/a/b/letzte");
    });
});

describe("isValidLocalizedPath", () => {
    it("accepts own-language localized slugs", () => {
        expect(routing.isValidLocalizedPath("/strani/poizvedba", "sl")).toBe(
            true
        );
        expect(routing.isValidLocalizedPath("/poljubno/a/b/zadnje", "sl")).toBe(
            true
        );
    });

    it("rejects foreign and half-translated slugs", () => {
        // canonical shape under a non-default language fails the round-trip
        expect(routing.isValidLocalizedPath("/pages/query", "sl")).toBe(false);
        // half-translated shape claimed by {slug} fails the round-trip
        expect(routing.isValidLocalizedPath("/strani/query", "sl")).toBe(false);
        // foreign localized slugs are rejected for any language
        expect(routing.isValidLocalizedPath("/strani/poizvedba", "en")).toBe(
            false
        );
        expect(routing.isValidLocalizedPath("/seiten/abfrage", "sl")).toBe(
            false
        );
    });

    it("accepts canonical paths for the unprefixed default language", () => {
        expect(routing.isValidLocalizedPath("/pages/query", "en")).toBe(true);
        // de maps "/server/rest" to itself; identity mappings must not
        // poison the default branch
        expect(routing.isValidLocalizedPath("/server/rest/a/b", "en")).toBe(
            true
        );
    });
});

describe("normalizePath", () => {
    it("normalizes empty, relative and trailing-slash paths", () => {
        expect(routing.normalizePath("")).toBe("/");
        expect(routing.normalizePath("pages/")).toBe("/pages");
        expect(routing.normalizePath("/")).toBe("/");
    });
});
