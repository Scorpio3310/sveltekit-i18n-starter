<script>
    import { useT, useTranslatePath } from "$i18n/i18n";
    import { page } from "$app/state";

    const t = useT();
    const translatePath = useTranslatePath();

    // 404 gets the "not found" copy, everything else the generic error
    const heading = $derived(
        page.status === 404 ? t("errors.title") : t("errors.error")
    );
</script>

<section class="grid gap-2">
    <h1 class="text-5xl font-bold my-5">{heading}</h1>
    <div class="grid text-center max-w-3xl mx-auto gap-4">
        <p class="bg-gray-100 p-3 rounded-xl font-mono text-sm">
            {page?.status} // {page?.error?.message}
        </p>
        <p class="text-lg">{t("errors.description")}</p>

        <a href={translatePath("/")} class="button w-fit mt-2 mx-auto"
            >← {t("errors.back")}</a
        >
    </div>
</section>
