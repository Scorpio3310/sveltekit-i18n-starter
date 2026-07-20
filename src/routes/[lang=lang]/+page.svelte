<script>
    import { useT } from "$i18n/i18n";
    import Card from "$components/Card.svelte";

    const t = useT();
</script>

<div class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">{t("home.h1")}</h1>
    <div class="mx-auto grid max-w-3xl gap-10">
        <p class="text-center text-lg">{t("home.description")}</p>

        <div class="grid gap-5">
            <h2 class="text-center text-2xl font-bold">
                {t("home.featuresTitle")}
            </h2>
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Card
                    title={t("home.features.slugs.title")}
                    description={t("home.features.slugs.description")}
                    link="/pages"
                />
                <Card
                    title={t("home.features.blog.title")}
                    description={t("home.features.blog.description")}
                    link="/blog"
                />
                <Card
                    title={t("home.features.reactive.title")}
                    description={t("home.features.reactive.description")}
                    link="/playground/i18n"
                />
                <Card
                    title={t("home.features.rest.title")}
                    description={t("home.features.rest.description")}
                    link="/rest"
                />
                <!-- sitemap.xml is a root endpoint shared by all languages,
                     so the link must bypass translatePath (external) -->
                <Card
                    title={t("home.features.seo.title")}
                    description={t("home.features.seo.description")}
                    link="/sitemap.xml"
                    external
                />
                <Card
                    title={t("home.features.endpoints.title")}
                    description={t("home.features.endpoints.description")}
                    link="/server"
                />
            </div>
            <p class="text-center text-sm opacity-60">
                {t("home.detectionNote")}
            </p>
        </div>
    </div>
</div>
