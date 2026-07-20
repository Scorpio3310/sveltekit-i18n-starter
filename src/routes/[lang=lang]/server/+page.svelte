<script>
    import { useT } from "$i18n/i18n";
    import Card from "$components/Card.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">{t("server.h1")}</h1>
    <div class="mx-auto grid max-w-3xl gap-10">
        <p class="text-center text-lg">{t("server.description")}</p>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
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
