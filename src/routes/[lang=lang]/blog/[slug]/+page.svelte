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
        <!-- The global h1 rule (app.css) is unlayered, so it beats plain
             utilities regardless of specificity — the important modifier
             is needed to left-align the post title. -->
        <h1 class="text-left!">{data.post.title}</h1>
        <p class="text-sm opacity-70">
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
