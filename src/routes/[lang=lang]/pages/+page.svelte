<script>
    import { t } from "$i18n/i18n";
    import { translatePath } from "$i18n/i18n";
</script>

<svelte:head>
    <title>{t("pages.head.title")}</title>
    <meta name="description" content={t("pages.head.description")} />
</svelte:head>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("pages.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("pages.description")}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            {@render card(
                t("pages.simple.title"),
                t("pages.simple.description"),
                "/pages/simple"
            )}

            {@render card(
                t("pages.query.title"),
                t("pages.query.description"),
                "/pages/query?x=1&y=2"
            )}
            {@render card(
                t("pages.slug.title"),
                t("pages.slug.description"),
                "/pages/this-is-slug"
            )}
            {@render card(
                t("pages.slugBetween.title"),
                t("pages.slugBetween.description"),
                "/pages/this-is-slug/last"
            )}
            {@render card(
                t("pages.external.title"),
                t("pages.external.description"),
                "/external",
                true
            )}
        </div>
    </div>
</section>

{#snippet card(title, description, link, external = false)}
    <div class="border border-black/10 p-5 rounded-4xl flex flex-col gap-2">
        <h2 class="text-xl font-bold">
            {title}
        </h2>
        <p class="text-sm opacity-70">{description}</p>
        {#if external}
            <a href={link} class="button w-fit mt-2">
                {t("pages.viewMore")} →
            </a>
        {:else}
            <a href={translatePath(link)} class="button w-fit mt-2">
                {t("pages.viewMore")} →
            </a>
        {/if}
    </div>
{/snippet}
