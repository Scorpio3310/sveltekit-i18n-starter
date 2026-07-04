<script>
    import { makeT } from "$i18n/i18n";
    import { SUPPORTED_LANGS as languages } from "$i18n/languages";
    import { page } from "$app/state";

    // Deliberately context-free demo: this page lives outside [lang=lang]
    // and drives its own translator with makeT + local state.
    let selected = $state(page?.data?.lang || "en");
    const tLocal = $derived(makeT(selected));

    /** @param {string} lang */
    function choose(lang) {
        if (!languages.includes(lang)) return;
        selected = lang;
    }
</script>

<div class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">{tLocal("external.h1")}</h1>
    <div class="grid text-center max-w-3xl mx-auto gap-4">
        <p class="text-lg">{tLocal("external.description")}</p>
    </div>
    <div class="flex gap-4 flex-wrap justify-center">
        {#each languages as l (l)}
            <button
                type="button"
                class="button"
                aria-pressed={selected === l}
                onclick={() => choose(l)}
            >
                {l.toUpperCase()}
            </button>
        {/each}
    </div>
</div>
