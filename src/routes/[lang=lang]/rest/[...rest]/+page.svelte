<script>
    import { t } from "$i18n/i18n";
    import { page } from "$app/state";
</script>

<svelte:head>
    <title>{t("restDynamic.head.title")}</title>
    <meta name="description" content={t("restDynamic.head.description")} />
</svelte:head>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("restDynamic.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("restDynamic.description")}</p>
        <div class="bg-gray-100 rounded-2xl p-5 grid gap-0.5 overflow-auto">
            <code><b>Rest:</b> {page?.params?.rest}</code>
            <code><b>URL:</b> {page?.url?.href}</code>
            <code><b>Page Route:</b> {JSON.stringify(page?.route?.id)}</code>
            <code><b>Lang:</b> {page?.data?.lang}</code>
            <code><b>intlLocale:</b> {page?.data?.intlLocale}</code>
            <hr class="my-2 border-black/10" />
            <code><b>Queries</b></code>
            {#if page?.url?.searchParams}
                {#each [...page.url.searchParams.entries()] as [key, value]}
                    <code><b>{key}:</b> {value}</code>
                {/each}
            {/if}
            {#if [...(page?.url?.searchParams?.entries() || [])].length === 0}
                <code class="opacity-40"><i>No query parameters found</i></code>
            {/if}
        </div>
    </div>
</section>
