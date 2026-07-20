// SEO metadata consumed by the root layout <svelte:head>.
import { isNoindexed } from "$lib/seo";

/** @type {import('./$types').PageLoad} */
export function load({ route }) {
    return { seoKey: "playgroundApi", noindex: isNoindexed(route.id) };
}
