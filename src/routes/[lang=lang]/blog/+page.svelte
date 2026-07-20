<script>
    import { useT, useTranslatePath } from "$i18n/i18n";
    import BlogPostList from "$components/BlogPostList.svelte";

    const t = useT();
    const translatePath = useTranslatePath();

    let { data } = $props();
</script>

<svelte:head>
    <link
        rel="alternate"
        type="application/rss+xml"
        title={t("blog.head.title")}
        href={translatePath("/rss.xml")}
    />
</svelte:head>

<section class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">{t("blog.h1")}</h1>
    <BlogPostList
        posts={data.items}
        page={data.page}
        totalPages={data.totalPages}
        intlLocale={data.intlLocale}
    />
</section>
