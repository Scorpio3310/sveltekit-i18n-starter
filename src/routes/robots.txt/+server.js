import { env } from "$env/dynamic/private";
import DEV_ROBOTS_TXT from "./dev_robots.txt?raw";
import PRODUCTION_ROBOTS_TXT from "./production_robots.txt?raw";

/**
 * Extract the host from PRODUCTION_DOMAIN, tolerating values with or
 * without a scheme (e.g. "https://your-app.com" or "your-app.com").
 * @param {string} domain
 * @returns {string} host or "" when unparseable
 */
function hostOf(domain) {
    try {
        return new URL(domain.includes("://") ? domain : `https://${domain}`)
            .host;
    } catch {
        return "";
    }
}

export async function GET({ url }) {
    // Exact host match: an empty/unset PRODUCTION_DOMAIN or a lookalike host
    // (e.g. "your-app.com.evil.test") must NOT be treated as production.
    const prodHost = env.PRODUCTION_DOMAIN ? hostOf(env.PRODUCTION_DOMAIN) : "";
    const isProd = !!prodHost && url.host === prodHost;

    const body = isProd
        ? `${PRODUCTION_ROBOTS_TXT.trimEnd()}\n\nSitemap: ${url.origin}/sitemap.xml\n`
        : DEV_ROBOTS_TXT;

    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
