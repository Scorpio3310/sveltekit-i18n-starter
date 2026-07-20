<script>
    import { useT, useTranslatePath } from "$i18n/i18n";
    import { formatDate } from "$lib/helpers";

    /**
     * @type {{
     *     posts: import('$lib/content/blog').PostMeta[],
     *     page: number,
     *     totalPages: number,
     *     intlLocale: string,
     * }}
     */
    let { posts, page, totalPages, intlLocale } = $props();

    const t = useT();
    const translatePath = useTranslatePath();

    /** @param {number} n */
    function pageHref(n) {
        return n === 1
            ? translatePath("/blog")
            : translatePath(`/blog/page/${n}`);
    }
</script>

<div class="mx-auto grid w-full max-w-3xl gap-10">
    <p class="text-center text-lg">{t("blog.description")}</p>

    <ul class="grid list-none gap-5">
        {#each posts as post (post.slug)}
            <li class="rounded-4xl border border-black/10 p-6">
                <article class="flex flex-col gap-2">
                    <h2 class="text-xl font-bold">
                        <a
                            href={translatePath(`/blog/${post.slug}`)}
                            class="hover:opacity-50"
                        >
                            {post.title}
                        </a>
                    </h2>
                    <p class="text-sm opacity-70">
                        {post.author} ·
                        <time datetime={post.pubDate}>
                            {formatDate(post.pubDate, intlLocale)}
                        </time>
                    </p>
                    <p class="text-sm">{post.description}</p>
                    <a
                        href={translatePath(`/blog/${post.slug}`)}
                        class="button mt-2 w-fit"
                    >
                        {t("actions.viewMore")} →
                    </a>
                </article>
            </li>
        {/each}
    </ul>

    {#if totalPages > 1}
        <nav
            aria-label={t("blog.paginationLabel")}
            class="flex items-center justify-center gap-4"
        >
            {#if page > 1}
                <a href={pageHref(page - 1)} class="button">
                    ← {t("blog.newer")}
                </a>
            {/if}
            <span class="text-sm opacity-70">{page} / {totalPages}</span>
            {#if page < totalPages}
                <a href={pageHref(page + 1)} class="button">
                    {t("blog.older")} →
                </a>
            {/if}
        </nav>
    {/if}
</div>
