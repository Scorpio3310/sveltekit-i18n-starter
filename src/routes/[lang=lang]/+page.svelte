<script>
    import { t } from "$i18n/i18n";
</script>

<svelte:head>
    <title>{t("home.head.title")}</title>
    <meta name="description" content={t("home.head.description")} />
</svelte:head>

<div class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("home.h1")}</h1>
    <div class="grid text-center max-w-2xl mx-auto gap-4">
        <p class="text-lg">{t("home.description")}</p>
        <div
            class="bg-neutral-100 text-neutral-500 rounded-2xl font-medium py-4 px-6 w-fit justify-self-center"
        >
            {t("home.warning")}
        </div>
    </div>
</div>
