import { json } from "@sveltejs/kit";
/**
 * GET /server/rest/[...rest]
 * Echoes rest segments and query for quick validation of prefix + mapping.
 *
 * Try:
 * - /server/rest/a/b?x=1
 * - /sl/streznik/rest/a/b?x=1 (with Slovenian mapping)
 */
export function GET({ params, url }) {
    const rest = (params.rest || "").split("/").filter(Boolean);
    return json(
        {
            ok: true,
            endpoint: "rest",
            lang: params.lang,
            rest,
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

/**
 * POST /server/rest/[...rest]
 * Echoes the request body (JSON or FormData) along with rest segments.
 *
 * cURL examples:
 * - JSON: curl -X POST -H 'content-type: application/json' \
 *   --data '{"a":1}' http://localhost:5173/sl/streznik/rest/foo
 * - Form: curl -X POST -F 'a=1' -F 'b=2' http://localhost:5173/sl/streznik/rest/foo
 */
export async function POST({ request, params, url }) {
    /** @type {any} */
    let body;
    const ctype = request.headers.get("content-type") || "";
    try {
        if (ctype.includes("application/json")) {
            body = await request.json();
        } else if (
            ctype.includes("application/x-www-form-urlencoded") ||
            ctype.includes("multipart/form-data")
        ) {
            const form = await request.formData();
            body = Object.fromEntries(
                [...form.entries()].map(([k, v]) => [
                    k,
                    typeof v === "string" ? v : v.name,
                ])
            );
        } else {
            body = await request.text();
        }
    } catch (e) {
        body = { error: String(e) };
    }

    const rest = (params.rest || "").split("/").filter(Boolean);
    return json(
        {
            ok: true,
            endpoint: "rest",
            method: "POST",
            lang: params.lang,
            rest,
            path: url.pathname,
            query: Object.fromEntries(url.searchParams.entries()),
            body,
        },
        {
            headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
            },
        }
    );
}
