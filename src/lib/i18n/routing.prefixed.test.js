// Unit tests for localized-slug routing with PREFIX_DEFAULT=true.
// Separate file because PREFIX_DEFAULT is baked in at module load and
// vitest isolates module registries per test file.
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("$env/dynamic/public", () => ({
    env: {
        PUBLIC_DEFAULT_LOCALE: "en",
        PUBLIC_PREFIX_DEFAULT_LOCALE: "true",
    },
}));

/** @type {typeof import('./routing.js')} */
let routing;

beforeAll(async () => {
    routing = await import("./routing.js");
});

describe("prefixed default language mode", () => {
    it("applies the prefix to the default language", () => {
        expect(routing.PREFIX_DEFAULT).toBe(true);
        expect(routing.PREFIX_RULE.apply("/pages/query", "en")).toBe(
            "/en/pages/query"
        );
        expect(routing.PREFIX_RULE.apply("/", "en")).toBe("/en");
    });

    it("switchLanguageUrl targets the prefixed default", () => {
        expect(
            routing.switchLanguageUrl(
                "/sl/strani/poizvedba?x=1",
                undefined,
                "en"
            )
        ).toBe("/en/pages/query?x=1");
        expect(
            routing.switchLanguageUrl("/en/pages/query", undefined, "sl")
        ).toBe("/sl/strani/poizvedba");
    });

    it("validates default-language paths strictly", () => {
        expect(routing.isValidLocalizedPath("/pages/query", "en")).toBe(true);
        expect(routing.isValidLocalizedPath("/strani/poizvedba", "en")).toBe(
            false
        );
    });
});
