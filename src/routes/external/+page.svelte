<script>
    import { makeT, languages } from "$i18n/i18n";
    import { page } from "$app/state";

    let selected = $state(page?.data?.lang || "en");
    let tLocal = $state(makeT(selected));

    function choose(lang) {
        if (!languages.includes(lang)) return;
        selected = lang;
        tLocal = makeT(lang);
    }
</script>

<svelte:head>
    <title>{tLocal("external.head.title")}</title>
    <meta name="description" content={tLocal("external.head.description")} />
</svelte:head>

<div class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{tLocal("external.h1")}</h1>
    <div class="grid text-center max-w-3xl mx-auto gap-4">
        <p class="text-lg">{tLocal("external.description")}</p>
    </div>
    <div class="flex gap-4 flex-wrap justify-center">
        {#each languages as l}
            <a
                href={page.url.pathname}
                class="button"
                onclick={(e) => {
                    e.preventDefault();
                    choose(l);
                }}>{l.toUpperCase()}</a
            >
        {/each}
    </div>
</div>
