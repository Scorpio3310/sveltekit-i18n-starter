<script>
    import { t } from "$i18n/i18n";
    import { translatePath } from "$i18n/i18n";
</script>

<svelte:head>
    <title>{t("server.head.title")}</title>
    <meta name="description" content={t("server.head.description")} />
</svelte:head>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("server.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("server.description")}</p>

        <div class="grid grid-cols-2 gap-5">
            {@render card(
                t("server.simple.title"),
                t("server.simple.description"),
                "/server/simple"
            )}

            {@render card(
                t("server.rest.title"),
                t("server.rest.description"),
                "/server/rest/a/b?x=1"
            )}
            {@render card(
                t("server.translated.title"),
                t("server.translated.description"),
                "/server/translated"
            )}
        </div>
    </div>
</section>

{#snippet card(title, description, link)}
    <div class="border border-black/10 p-5 rounded-4xl flex flex-col gap-2">
        <h2 class="text-xl font-bold">
            {title}
        </h2>
        <p class="text-sm opacity-70">{description}</p>
        <a href={translatePath(link)} class="button w-fit mt-2">
            {t("server.viewMore")} →
        </a>
    </div>
{/snippet}
