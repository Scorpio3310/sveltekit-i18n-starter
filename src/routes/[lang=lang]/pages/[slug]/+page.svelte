<script>
    import { t } from "$i18n/i18n";
    import { page } from "$app/state";
</script>

<svelte:head>
    <title>{t("pageSlug.head.title")}</title>
    <meta name="description" content={t("pageSlug.head.description")} />
</svelte:head>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("pageSlug.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("pageSlug.description")}</p>
        <div class="bg-gray-100 rounded-2xl p-5 grid gap-0.5 overflow-auto">
            <code><b>Slug:</b> {page?.params?.slug}</code>
            <code><b>URL:</b> {page?.url?.href}</code>
            <code><b>Page Route:</b> {JSON.stringify(page?.route?.id)}</code>
            <code><b>Lang:</b> {page?.data?.lang}</code>
            <code><b>intlLocale:</b> {page?.data?.intlLocale}</code>
        </div>
    </div>
</section>
