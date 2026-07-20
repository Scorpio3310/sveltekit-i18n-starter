// Resolves the post and its cross-language alternates on the server.
// The alternates map lists only languages the post actually exists in
// (partial translations) and feeds the hreflang tags and the language
// switcher; missing languages fall back to that language's blog index.
import { error } from "@sveltejs/kit";
import { alternatesFor, resolvePost } from "$lib/content/blog";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    const post = await resolvePost(params.lang, params.slug);
    if (!post) {
        // Unknown slug — including another language's slug under this
        // prefix — renders the translated 404 page.
        error(404);
    }

    return {
        post: post.metadata,
        langAlternates: await alternatesFor(params.lang, params.slug),
        alternatesFallbackPath: "/blog",
        seoTitle: post.metadata.title,
        seoDescription: post.metadata.description,
    };
}
