// SEO metadata consumed by the root layout <svelte:head>.
import { isNoindexed } from "$lib/seo";

/** @type {import('./$types').PageLoad} */
export function load({ route }) {
    return { seoKey: "playgroundI18n", noindex: isNoindexed(route.id) };
}
