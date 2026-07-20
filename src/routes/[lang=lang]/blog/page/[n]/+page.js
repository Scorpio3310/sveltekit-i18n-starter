// Blog index pages 2+ ("/blog/page/2", localized e.g. "/sl/blog/stran/2").
// Page 1 canonically lives at /blog, so /blog/page/1 permanently redirects.
import { error, redirect } from "@sveltejs/kit";
import { paginate, postsFor } from "$lib/content/blog";
import { translatePathFor } from "$i18n/i18n";

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const n = Number(params.n);
    if (!Number.isInteger(n) || n < 1 || String(n) !== params.n) {
        error(404);
    }
    if (n === 1) {
        redirect(308, translatePathFor("/blog", params.lang));
    }

    const posts = await postsFor(params.lang);
    const page = paginate(posts, n);
    if (n > page.totalPages) {
        error(404);
    }
    return { seoKey: "blog", ...page };
}
