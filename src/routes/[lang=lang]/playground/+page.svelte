<script>
    import { useT } from "$i18n/i18n";
    import Card from "$components/Card.svelte";

    const t = useT();
</script>

<section class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">{t("playground.h1")}</h1>
    <div class="mx-auto grid max-w-3xl gap-10">
        <p class="text-center text-lg">{t("playground.description")}</p>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
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
