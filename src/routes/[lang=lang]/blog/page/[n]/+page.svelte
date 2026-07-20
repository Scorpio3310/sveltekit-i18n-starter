<script>
    import { useT } from "$i18n/i18n";
    import BlogPostList from "$components/BlogPostList.svelte";

    const t = useT();

    let { data } = $props();
</script>

<section class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">{t("blog.h1")}</h1>
    <BlogPostList
        posts={data.items}
        page={data.page}
        totalPages={data.totalPages}
        intlLocale={data.intlLocale}
    />
</section>
