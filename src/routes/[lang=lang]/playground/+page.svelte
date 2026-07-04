<script>
    import { useT } from "$i18n/i18n";
    import Card from "$components/Card.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{t("playground.h1")}</h1>
    <div class="grid max-w-3xl mx-auto gap-10">
        <p class="text-lg text-center">{t("playground.description")}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card
                title={t("playground.api.title")}
                description={t("playground.api.description")}
                link="/playground/api"
            />
            <Card
                title={t("playground.i18n.title")}
                description={t("playground.i18n.description")}
                link="/playground/i18n"
            />
        </div>
    </div>
</section>
