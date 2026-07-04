<script>
    import { translatePath } from "$i18n/i18n";
    import { t } from "$i18n/i18n";
</script>

<footer
    class=" text-sm opacity-70 border-t border-t-black/10 w-full max-w-7xl mx-auto text-center py-4"
>
    <a
        href={translatePath("/")}
        aria-label="Home"
        class="mb-2 block hover:opacity-50"
    >
        <p>{t("footer.description")}</p>
    </a>
    <a
        href="https://www.klemenc.si"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t("footer.name")}`}
        tabindex="0"
        class="hover:opacity-50"
    >
        {t("footer.name")}
    </a>
    <span> // &copy; {t("footer.copy")} {new Date().getFullYear()}</span>
    <span> // {t("footer.made", { what: "SvelteKit" })}</span>
</footer>
