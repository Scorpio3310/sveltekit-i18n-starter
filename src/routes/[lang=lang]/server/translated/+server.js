import { json } from "@sveltejs/kit";

/**
 * GET /server/translated
 * Returns a translated string using the current language (via locals.t).
 *
 * Try:
 * - EN: /server/translated
 * - SL: /sl/streznik/prevedeno
 */

export function GET({ locals, params, url }) {
    const t = locals.t;
    const title = t("server.translated.translated");
    return json(
        {
            ok: true,
            endpoint_translated: title,
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
