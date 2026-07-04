<script>
    import { useT } from "$i18n/i18n";
    import Card from "$components/Card.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("server.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("server.description")}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card
                title={t("server.simple.title")}
                description={t("server.simple.description")}
                link="/server/simple"
            />
            <Card
                title={t("server.rest.title")}
                description={t("server.rest.description")}
                link="/server/rest/a/b?x=1"
            />
            <Card
                title={t("server.translated.title")}
                description={t("server.translated.description")}
                link="/server/translated"
            />
        </div>
    </div>
</section>
