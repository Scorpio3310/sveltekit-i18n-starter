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
    <h1 class="my-5 text-5xl font-bold">{heading}</h1>
    <div class="mx-auto grid max-w-3xl gap-4 text-center">
        <p class="rounded-xl bg-gray-100 p-3 font-mono text-sm">
            {page?.status} // {page?.error?.message}
        </p>
        <p class="text-lg">{t("errors.description")}</p>

        <a href={translatePath("/")} class="button mx-auto mt-2 w-fit"
            >← {t("errors.back")}</a
        >
    </div>
</section>
