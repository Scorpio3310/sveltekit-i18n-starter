<script>
    import { useT, useTranslatePath } from "$i18n/i18n";
    import { formatDate } from "$lib/helpers";

    const t = useT();
    const translatePath = useTranslatePath();

    let { data } = $props();

    const PostContent = $derived(data.PostContent);
</script>

<article class="mx-auto grid w-full max-w-3xl gap-6">
    <a href={translatePath("/blog")} class="w-fit hover:opacity-50">
        ← {t("blog.backToBlog")}
    </a>

    <header>
        <h1>{data.post.title}</h1>
        <p class="text-center text-sm opacity-70">
            {data.post.author} ·
            <time datetime={data.post.pubDate}>
                {formatDate(data.post.pubDate, data.intlLocale)}
            </time>
        </p>
    </header>

    <!-- Typography for the markdown body lives in app.css (.post-content) -->
    <div class="post-content">
        <PostContent />
    </div>
</article>
