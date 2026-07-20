// Unit tests for the handle hook (PREFIX_DEFAULT=false): root language
// detection, prefix canonicalization, cookie policy, locals and <html lang>.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { isRedirect } from "@sveltejs/kit";

vi.mock("$env/dynamic/public", () => ({
    env: {
        PUBLIC_DEFAULT_LOCALE: "en",
        PUBLIC_PREFIX_DEFAULT_LOCALE: "false",
    },
}));

/** @type {typeof import('./hooks.server.js')} */
let hooksServer;

beforeAll(async () => {
    hooksServer = await import("./hooks.server.js");
});

/**
 * Build a minimal RequestEvent double for handle().
 * @param {string} path pathname plus optional search, e.g. "/sl?x=1"
 * @param {{ cookies?: Record<string, string>, acceptLanguage?: string, headers?: Record<string, string>, isDataRequest?: boolean }} [opts]
 */
function makeEvent(
    path,
    { cookies = {}, acceptLanguage, headers: extraHeaders, isDataRequest } = {}
) {
    const jar = new Map(Object.entries(cookies));
    /** @type {{ name: string, value: string, opts: any }[]} */
    const setCookies = [];
    const headers = new Headers(extraHeaders);
    if (acceptLanguage) headers.set("accept-language", acceptLanguage);
    return {
        isDataRequest: isDataRequest ?? false,
        url: new URL(`http://localhost${path}`),
        request: { headers },
        cookies: {
            /** @param {string} name */
            get: (name) => jar.get(name),
            /**
             * @param {string} name
             * @param {string} value
             * @param {any} opts
             */
            set: (name, value, opts) => {
                jar.set(name, value);
                setCookies.push({ name, value, opts });
            },
        },
        locals: /** @type {App.Locals} */ ({}),
        setCookies,
    };
}

/**
 * Run handle() with a spy resolve; returns the event, the response and the
 * resolve options handle passed (for transformPageChunk assertions).
 * @param {ReturnType<typeof makeEvent>} event
 */
async function runHandle(event) {
    /** @type {any} */
    let resolveOpts;
    const resolve = vi.fn(async (_event, opts) => {
        resolveOpts = opts;
        return new Response("ok");
    });
    const response = await hooksServer.handle({
        event: /** @type {any} */ (event),
        resolve,
    });
    return { event, response, resolve, resolveOpts };
}

/**
 * Expect handle() to throw a SvelteKit redirect.
 * @param {ReturnType<typeof makeEvent>} event
 * @param {number} status
 * @param {string} location
 */
async function expectRedirect(event, status, location) {
    try {
        await runHandle(event);
    } catch (e) {
        expect(isRedirect(e)).toBe(true);
        const r = /** @type {import('@sveltejs/kit').Redirect} */ (e);
        expect(r.status).toBe(status);
        expect(r.location).toBe(location);
        return;
    }
    expect.fail(`expected a ${status} redirect to ${location}`);
}

describe("root '/' language detection", () => {
    it("302-redirects to the Accept-Language match", async () => {
        await expectRedirect(
            makeEvent("/", { acceptLanguage: "sl-SI,sl;q=0.9,en;q=0.5" }),
            302,
            "/sl"
        );
    });

    it("the lang cookie wins over Accept-Language", async () => {
        await expectRedirect(
            makeEvent("/", {
                cookies: { lang: "de" },
                acceptLanguage: "sl;q=0.9",
            }),
            302,
            "/de"
        );
    });

    it("preserves the query string", async () => {
        await expectRedirect(
            makeEvent("/?x=1", { acceptLanguage: "de" }),
            302,
            "/de?x=1"
        );
    });

    it("stays at root for the default language", async () => {
        const { event, response } = await runHandle(
            makeEvent("/", { acceptLanguage: "en-US,en;q=0.9" })
        );
        expect(response.status).toBe(200);
        expect(event.locals.lang).toBe("en");
    });

    // Regression: clicking EN in the switcher on a non-default home page
    // navigates to "/" — that must serve the default language and update
    // the cookie, not bounce back to the cookie language forever.
    it("client-side navigation to '/' overrides the cookie (explicit choice)", async () => {
        const { event, response } = await runHandle(
            makeEvent("/", { cookies: { lang: "de" }, isDataRequest: true })
        );
        expect(response.status).toBe(200);
        expect(event.locals.lang).toBe("en");
        expect(event.setCookies).toMatchObject([{ name: "lang", value: "en" }]);
    });

    it("same-origin document requests to '/' skip the redirect (no-JS switcher)", async () => {
        const { event, response } = await runHandle(
            makeEvent("/", {
                cookies: { lang: "de" },
                headers: { "sec-fetch-site": "same-origin" },
            })
        );
        expect(response.status).toBe(200);
        expect(event.locals.lang).toBe("en");
    });

    it("internal navigation also ignores Accept-Language", async () => {
        const { response } = await runHandle(
            makeEvent("/", {
                acceptLanguage: "sl;q=0.9",
                headers: { "sec-fetch-site": "same-origin" },
            })
        );
        expect(response.status).toBe(200);
    });

    it("external entries still get the preference redirect", async () => {
        await expectRedirect(
            makeEvent("/", {
                cookies: { lang: "de" },
                headers: { "sec-fetch-site": "none" },
            }),
            302,
            "/de"
        );
    });
});

describe("prefix canonicalization (non-prefix mode)", () => {
    it("308-strips the default-language prefix", async () => {
        await expectRedirect(
            makeEvent("/en/pages/query?x=1"),
            308,
            "/pages/query?x=1"
        );
    });

    it("collapses leading slashes so the target stays same-origin", async () => {
        await expectRedirect(makeEvent("/en//evil.com"), 308, "/evil.com");
    });

    it("serves non-default prefixed pages without redirecting", async () => {
        const { response } = await runHandle(makeEvent("/sl/strani/poizvedba"));
        expect(response.status).toBe(200);
    });
});

describe("locals and <html lang>", () => {
    it("exposes lang, intlLocale and a working translator", async () => {
        const { event } = await runHandle(makeEvent("/sl/strani/poizvedba"));
        expect(event.locals.lang).toBe("sl");
        expect(event.locals.intlLocale).toBe("sl-SI");
        expect(event.locals.t("menu.home")).toBe("Domov");
    });

    it("replaces %html-lang% via transformPageChunk", async () => {
        const { resolveOpts } = await runHandle(makeEvent("/de/seiten"));
        const html = resolveOpts.transformPageChunk({
            html: '<html lang="%html-lang%">',
        });
        expect(html).toBe('<html lang="de">');
    });

    it("404 paths render in the visitor's language, not the default", async () => {
        const { event } = await runHandle(
            makeEvent("/de1", { cookies: { lang: "de" } })
        );
        expect(event.locals.lang).toBe("de");
    });
});

describe("lang cookie policy", () => {
    it("localized pages set the cookie with sane attributes", async () => {
        const { event } = await runHandle(makeEvent("/sl/strani"));
        expect(event.setCookies).toHaveLength(1);
        const cookie = event.setCookies[0];
        expect(cookie).toMatchObject({ name: "lang", value: "sl" });
        expect(cookie.opts).toMatchObject({ path: "/", sameSite: "lax" });
    });

    it("does not rewrite an already-correct cookie", async () => {
        const { event } = await runHandle(
            makeEvent("/sl/strani", { cookies: { lang: "sl" } })
        );
        expect(event.setCookies).toHaveLength(0);
    });

    it("404s and non-localized routes never touch the cookie", async () => {
        for (const path of ["/de1", "/robots.txt", "/external"]) {
            const { event } = await runHandle(
                makeEvent(path, { cookies: { lang: "de" } })
            );
            expect(event.setCookies).toHaveLength(0);
        }
    });
});
