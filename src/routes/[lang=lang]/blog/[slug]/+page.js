// Universal load: attaches the mdsvex component for the post so client-side
// navigation dynamic-imports only the viewed post's chunk.
import { error } from "@sveltejs/kit";
import { resolvePost } from "$lib/content/blog";

/** @type {import('./$types').PageLoad} */
export async function load({ params, data }) {
    const post = await resolvePost(params.lang, params.slug);
    if (!post) {
        error(404); // server load already 404s; kept for type narrowing
    }
    return { ...data, PostContent: post.component };
}
