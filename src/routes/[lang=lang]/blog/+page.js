// Blog index, page 1. Deeper pages live under /blog/page/[n].
import { paginate, postsFor } from "$lib/content/blog";

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const posts = await postsFor(params.lang);
    return { seoKey: "blog", ...paginate(posts, 1) };
}
