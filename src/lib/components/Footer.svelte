<script>
    import { useT, useTranslatePath } from "$i18n/i18n";

    const t = useT();
    const translatePath = useTranslatePath();

    // computed once per app load; avoids re-running Date in the template
    const year = new Date().getFullYear();
</script>

<footer
    class=" text-sm opacity-70 border-t border-t-black/10 w-full max-w-7xl mx-auto text-center py-4"
>
    <a href={translatePath("/")} class="mb-2 block hover:opacity-50">
        <p>{t("footer.description")}</p>
    </a>
    <a
        href="https://www.klemenc.si"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:opacity-50"
    >
        {t("footer.name")}
    </a>
    <span> // &copy; {t("footer.copy")} {year}</span>
    <span> // {t("footer.made", { what: "SvelteKit" })}</span>
</footer>
