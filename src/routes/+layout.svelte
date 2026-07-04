<script>
    import "../app.css";
    import { page } from "$app/state";
    import { setI18nContext } from "$i18n/i18n";
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
</script>

<svelte:head>
    <title>{t('home.head.title')}</title>
    <meta name="description" content={t('home.head.description')} />
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={page?.url?.href} />
    <meta property="og:title" content={t('home.head.title')} />
    <meta property="og:description" content={t('home.head.description')} />
    <meta property="og:image" content="{page?.url?.origin}/og_image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content={t('home.head.title')} />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={page?.url?.href} />
    <meta property="twitter:title" content={t('home.head.title')} />
    <meta property="twitter:description" content={t('home.head.description')} />
    <meta property="twitter:image" content="{page?.url?.origin}/og_image.jpg" />
</svelte:head>

<Navbar />
<main class="max-w-7xl w-full self-center mt-20 md:mt-28 mb-10 py-4 flex-1">
    {@render children?.()}
</main>
<Footer />
