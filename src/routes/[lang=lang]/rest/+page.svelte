<script>
    import { useT } from "$i18n/i18n";
    import Card from "$components/Card.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">{t("rest.h1")}</h1>
    <div class="mx-auto grid max-w-3xl gap-10">
        <p class="text-center text-lg">{t("rest.description")}</p>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card
                title={t("rest.dynamic.title")}
                description={t("rest.dynamic.description")}
                link="/rest/dynamic/a/b/c"
            />
            <Card
                title={t("rest.restBetween.title")}
                description={t("rest.restBetween.description")}
                link="/rest/a/b/c/last"
            />
        </div>
    </div>
</section>
