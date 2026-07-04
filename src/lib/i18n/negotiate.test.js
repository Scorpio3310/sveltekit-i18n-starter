import { describe, expect, it } from "vitest";
import { negotiateLanguage } from "./negotiate.js";

const SUPPORTED = ["en", "sl", "de"];

describe("negotiateLanguage", () => {
    it("picks the highest-quality supported language", () => {
        expect(negotiateLanguage("sl,en;q=0.8", SUPPORTED)).toBe("sl");
        expect(negotiateLanguage("fr;q=0.9,de;q=0.8", SUPPORTED)).toBe("de");
        expect(negotiateLanguage("en;q=0.3,sl;q=0.7,de;q=0.5", SUPPORTED)).toBe(
            "sl"
        );
    });

    it("collapses region subtags", () => {
        expect(negotiateLanguage("de-AT,fr;q=0.5", SUPPORTED)).toBe("de");
        expect(negotiateLanguage("en-GB;q=0.9", SUPPORTED)).toBe("en");
    });

    it("keeps header order on quality ties", () => {
        expect(negotiateLanguage("de,sl", SUPPORTED)).toBe("de");
        expect(negotiateLanguage("sl,de", SUPPORTED)).toBe("sl");
    });

    it("ignores q=0 entries and wildcards", () => {
        expect(negotiateLanguage("de;q=0,sl;q=0.5", SUPPORTED)).toBe("sl");
        expect(negotiateLanguage("*", SUPPORTED)).toBeNull();
        expect(negotiateLanguage("*;q=1,de;q=0.5", SUPPORTED)).toBe("de");
    });

    it("returns null for unsupported, empty or malformed headers", () => {
        expect(negotiateLanguage("fr,es;q=0.9", SUPPORTED)).toBeNull();
        expect(negotiateLanguage("", SUPPORTED)).toBeNull();
        expect(negotiateLanguage(null, SUPPORTED)).toBeNull();
        expect(negotiateLanguage(";;;,,q=", SUPPORTED)).toBeNull();
        expect(negotiateLanguage("de;q=abc", SUPPORTED)).toBe("de"); // bad q ignored → q=1
    });
});
