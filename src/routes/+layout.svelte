<script>
    import "../app.css";
    import { page } from "$app/state";
    import { setI18nContext, switchLanguageUrl, localeForIntl } from "$i18n/i18n";
    import { normalizePath, DEFAULT_LANG } from "$i18n/routing";
    import { SUPPORTED_LANGS } from "$i18n/languages";
    import Navbar from "$components/Navbar.svelte";
    import Footer from "$components/Footer.svelte";

    let { children, data } = $props();

    // Set once at init (setContext is only valid here). Members read
    // data.lang at call time, so every t()/translatePath() call in any
    // descendant re-evaluates when the language changes on client-side
    // navigation.
    const { t } = setI18nContext(() => data.lang);

    // <html lang> for client-side language switches; SSR is handled by
    // transformPageChunk in hooks.server.js ($effect never runs on the server).
    $effect(() => {
        if (data.lang) document.documentElement.lang = data.lang;
    });

    // Pages declare their SEO metadata via `seoKey` (and optional `noindex`)
    // in +page.js; the layout renders a single set of head tags from it.
    const seoKey = $derived(page.data.seoKey ?? "home");
    const title = $derived(
        page.error
            ? page.status === 404
                ? t("errors.title")
                : t("errors.error")
            : t(`${seoKey}.head.title`)
    );
    const description = $derived(t(`${seoKey}.head.description`));

    // Canonical: current origin + normalized pathname, no query/hash.
    const canonicalUrl = $derived(
        page.url.origin + normalizePath(page.url.pathname)
    );

    // hreflang alternates only make sense for pages under [lang=lang].
    const isLocalized = $derived(
        page.route.id?.includes("[lang=lang]") ?? false
    );
    const alternates = $derived(
        isLocalized && !page.error
            ? SUPPORTED_LANGS.map((lang) => ({
                  lang,
                  href:
                      page.url.origin +
                      switchLanguageUrl(page.url.pathname, undefined, lang),
              }))
            : []
    );
    const xDefaultHref = $derived(
        alternates.find((a) => a.lang === DEFAULT_LANG)?.href
    );

    const ogLocale = $derived(
        (page.data.intlLocale ?? localeForIntl(data.lang)).replace("-", "_")
    );
    const ogImage = $derived(`${page.url.origin}/og_image.jpg`);
</script>

<svelte:head>
    <title>{title}</title>
    <meta name="description" content={description} />
    {#if page.data.noindex}
        <meta name="robots" content="noindex" />
    {/if}
    <link rel="canonical" href={canonicalUrl} />
    {#each alternates as alternate (alternate.lang)}
        <link
            rel="alternate"
            hreflang={alternate.lang}
            href={alternate.href}
        />
    {/each}
    {#if xDefaultHref}
        <link rel="alternate" hreflang="x-default" href={xDefaultHref} />
    {/if}

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:site_name" content={t("home.head.title")} />
    <meta property="og:locale" content={ogLocale} />
    {#each alternates.filter((a) => a.lang !== data.lang) as alternate (alternate.lang)}
        <meta
            property="og:locale:alternate"
            content={localeForIntl(alternate.lang).replace("-", "_")}
        />
    {/each}
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={canonicalUrl} />
    <meta property="twitter:title" content={title} />
    <meta property="twitter:description" content={description} />
    <meta property="twitter:image" content={ogImage} />
</svelte:head>

<Navbar />
<main class="max-w-7xl w-full self-center mt-20 md:mt-28 mb-10 py-4 flex-1">
    {@render children?.()}
</main>
<Footer />
