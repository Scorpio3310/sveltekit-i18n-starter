<script>
    import "../app.css";
    import { page } from "$app/state";
    import { setTContext, t } from "$i18n/i18n";
    import Navbar from "$components/Navbar.svelte";
    import Footer from "$components/Footer.svelte";

    let { children } = $props();
    // SSR / first render: make t() available before children render
    setTContext(page.data.lang);

    // Keep in sync on client navigation (no reactive $: label in Svelte 5)
    $effect(() => {
        const lang = page.data.lang;
        if (lang) setTContext(lang);
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
