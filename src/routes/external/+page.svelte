<script>
    import { makeT, loadDict } from "$i18n/i18n";
    import { SUPPORTED_LANGS as languages } from "$i18n/languages";
    import { page } from "$app/state";

    // Deliberately context-free demo: this page lives outside [lang=lang]
    // and drives its own translator with loadDict/makeT + local state.
    let selected = $state(page?.data?.lang || "en");
    const dictPromise = $derived(loadDict(selected));

    /** @param {string} lang */
    function choose(lang) {
        if (!languages.includes(lang)) return;
        selected = lang;
    }
</script>

{#await dictPromise then dict}
    {@const tLocal = makeT(dict)}
    <div class="grid gap-4">
        <h1 class="my-5 text-5xl font-bold">{tLocal("external.h1")}</h1>
        <div class="mx-auto grid max-w-3xl gap-4 text-center">
            <p class="text-lg">{tLocal("external.description")}</p>
        </div>
        <div class="flex flex-wrap justify-center gap-4">
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
{/await}
