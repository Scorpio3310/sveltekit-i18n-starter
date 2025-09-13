import { json } from "@sveltejs/kit";

/**
 * GET /server/simple
 * Basic JSON response to demonstrate a simple endpoint.
 *
 * Try:
 * - EN: /server/simple?name=Nik
 * - SL: /sl/streznik/enostaven?name=Nik
 */

export function GET({ params, url }) {
    return json(
        {
            ok: true,
            endpoint: "Hello from server!",
            lang: params.lang,
            path: url.pathname,
            query: Object.fromEntries(url.searchParams.entries()),
        },
        {
            headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
            },
        }
    );
}
