<script>
    import { useT } from "$i18n/i18n";
    import Card from "$components/Card.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("rest.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("rest.description")}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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
