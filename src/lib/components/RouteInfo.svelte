<script>
    import { page } from "$app/state";

    /**
     * Debug panel shared by the demo pages: shows the current route,
     * language and (optionally) matched params and query string.
     * @type {{ slug?: boolean, rest?: boolean, queries?: boolean }}
     */
    let { slug = false, rest = false, queries = false } = $props();

    const queryEntries = $derived([...page.url.searchParams.entries()]);
</script>

<div class="grid gap-0.5 overflow-auto rounded-2xl bg-gray-100 p-5">
    {#if slug}
        <code><b>Slug:</b> {page.params.slug}</code>
    {/if}
    {#if rest}
        <code><b>Rest:</b> {page.params.rest}</code>
    {/if}
    <code><b>URL:</b> {page.url.href}</code>
    <code><b>Page Route:</b> {JSON.stringify(page.route.id)}</code>
    <code><b>Lang:</b> {page.data.lang}</code>
    <code><b>intlLocale:</b> {page.data.intlLocale}</code>
    {#if queries}
        <hr class="my-2 border-black/10" />
        <code><b>Queries</b></code>
        {#each queryEntries as [key, value] (key)}
            <code><b>{key}:</b> {value}</code>
        {/each}
        {#if queryEntries.length === 0}
            <code class="opacity-40"><i>No query parameters found</i></code>
        {/if}
    {/if}
</div>
