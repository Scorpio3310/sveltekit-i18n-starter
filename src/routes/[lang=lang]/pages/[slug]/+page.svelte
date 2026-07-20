<script>
    import { useT } from "$i18n/i18n";
    import RouteInfo from "$components/RouteInfo.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">{t("pageSlug.h1")}</h1>
    <div class="mx-auto grid max-w-3xl gap-10">
        <p class="text-center text-lg">{t("pageSlug.description")}</p>
        <RouteInfo slug />
    </div>
</section>
