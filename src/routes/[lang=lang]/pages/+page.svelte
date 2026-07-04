<script>
    import { useT } from "$i18n/i18n";
    import Card from "$components/Card.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("pages.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("pages.description")}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card
                title={t("pages.simple.title")}
                description={t("pages.simple.description")}
                link="/pages/simple"
            />
            <Card
                title={t("pages.query.title")}
                description={t("pages.query.description")}
                link="/pages/query?x=1&y=2"
            />
            <Card
                title={t("pages.slug.title")}
                description={t("pages.slug.description")}
                link="/pages/this-is-slug"
            />
            <Card
                title={t("pages.slugBetween.title")}
                description={t("pages.slugBetween.description")}
                link="/pages/this-is-slug/last"
            />
            <Card
                title={t("pages.external.title")}
                description={t("pages.external.description")}
                link="/external"
                external
            />
        </div>
    </div>
</section>
