<script>
    import { useT } from "$i18n/i18n";
    const t = useT();
</script>

<div class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">{t("home.h1")}</h1>
    <div class="mx-auto grid max-w-2xl gap-4 text-center">
        <p class="text-lg">{t("home.description")}</p>
        <div
            class="w-fit justify-self-center rounded-2xl bg-neutral-100 px-6 py-4 font-medium text-neutral-500"
        >
            {t("home.warning")}
        </div>
    </div>
</div>
