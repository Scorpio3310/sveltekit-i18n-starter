<script>
    import { useT } from "$i18n/i18n";
    import RouteInfo from "$components/RouteInfo.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("pageSlugBetween.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("pageSlugBetween.description")}</p>
        <RouteInfo slug />
    </div>
</section>
