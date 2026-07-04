// Accept-Language negotiation. Pure and dependency-free.

/**
 * Pick the best supported language from an Accept-Language header.
 *
 * Handles quality values ("sl,en;q=0.8"), region subtags ("de-AT" matches
 * "de") and malformed input (returns null). Ties keep the header's order.
 *
 * @param {string | null | undefined} header Accept-Language header value
 * @param {readonly string[]} supported Supported language codes (e.g. ["en","sl","de"])
 * @returns {string | null} Best matching language, or null when nothing matches
 */
export function negotiateLanguage(header, supported) {
    if (!header || typeof header !== "string") return null;

    /** @type {{ lang: string, q: number, index: number }[]} */
    const candidates = [];
    for (const [index, part] of header.split(",").entries()) {
        const [rangeRaw, ...params] = part.trim().split(";");
        const range = rangeRaw?.trim().toLowerCase();
        if (!range) continue;

        let q = 1;
        for (const param of params) {
            const m = param.trim().match(/^q=([01](?:\.\d{0,3})?)$/i);
            if (m) q = Number.parseFloat(m[1]);
        }
        if (q <= 0) continue;

        // "de-AT" → "de"; "*" stays as-is
        const lang = range === "*" ? "*" : range.split("-")[0];
        candidates.push({ lang, q, index });
    }

    candidates.sort((a, b) => b.q - a.q || a.index - b.index);

    for (const { lang } of candidates) {
        if (lang === "*") continue; // wildcard carries no preference
        if (supported.includes(lang)) return lang;
    }
    return null;
}
