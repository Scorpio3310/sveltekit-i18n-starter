<script>
    import { useT, useTranslatePath } from "$i18n/i18n";

    /**
     * Link card used by the section landing pages.
     * @type {{
     *     title: string,
     *     description: string,
     *     link: string,
     *     external?: boolean
     * }}
     */
    let { title, description, link, external = false } = $props();

    const t = useT();
    const translatePath = useTranslatePath();
</script>

<div class="border border-black/10 p-5 rounded-4xl flex flex-col gap-2">
    <h2 class="text-xl font-bold">
        {title}
    </h2>
    <p class="text-sm opacity-70">{description}</p>
    <a href={external ? link : translatePath(link)} class="button w-fit mt-2">
        {t("actions.viewMore")} →
    </a>
</div>
