<script>
    import { page } from "$app/state";
    import { useT } from "$i18n/i18n";
    import { SUPPORTED_LANGS as languages } from "$i18n/languages";
    import {
        toCanonical,
        toLocalized,
        isValidLocalizedPath,
        DEFAULT_LANG,
        PREFIX_DEFAULT,
        normalizePath,
        PREFIX_RULE,
    } from "$i18n/routing";

    /**
     * I18n Playground
     *
     * How to run:
     * - Start dev server: pnpm dev
     * - Open: /playground/i18n (or /sl/igrisce/i18n in Slovenian)
     * - Type a path and choose a language; see live results below.
     */

    const t = useT();

    let inputPath = $state("/pages");

    // The select lets you try any language; it defaults to — and re-syncs
    // with — the current route's language. SvelteKit reuses this component on
    // param-only navigation, so without the effect the select would stay on
    // the old language after a navbar switch. (This syncs editable state to an
    // external change — navigation — which is a valid use of $effect, unlike
    // computing derived values.)
    let lang = $state(
        languages.includes(page.params.lang ?? "")
            ? /** @type {string} */ (page.params.lang)
            : DEFAULT_LANG
    );
    $effect(() => {
        const routeLang = page.params.lang;
        if (routeLang && languages.includes(routeLang)) lang = routeLang;
    });

    /** @param {unknown} v */
    function fmt(v) {
        return typeof v === "boolean"
            ? v
                ? "true"
                : "false"
            : String(v ?? "");
    }

    // Derived values — computed from inputPath/lang, no $effect needed
    const canonical = $derived(toCanonical(inputPath, lang));
    const localized = $derived(toLocalized(canonical, lang));
    const valid = $derived(isValidLocalizedPath(inputPath, lang));
    const prefixed = $derived(PREFIX_RULE.apply(localized, lang));
</script>

<section class="grid gap-5 max-w-4xl justify-self-center">
    <h1 class="text-5xl font-bold my-5">🌐 I18n Playground</h1>

    <div
        class="bg-blue-50 text-blue-400 rounded-2xl font-semibold py-4 px-6 w-fit justify-self-center"
    >
        {t("playground.notTranslated")}
    </div>

    <div>
        <p class="text-sm leading-6">
            This page shows the exact steps our router performs when handling
            localized URLs:
        </p>
        <ul class="list-disc ml-6 mt-1 text-sm leading-6">
            <li>
                <b>normalizePath</b> ensures a leading <code>/</code> and trims trailing
                slashes (except for root).
            </li>
            <li>
                <b>toCanonical</b> converts a localized path (without language
                prefix) to its canonical form using mappings from
                <code>src/lib/i18n/routes.js</code>. Supports placeholders like
                <code>{`{slug}`}</code> and multi‑segment
                <code>{`{...rest}`}</code>.
            </li>
            <li>
                <b>toLocalized</b> converts the canonical path to the target language
                using the same mappings.
            </li>
            <li>
                <b>isValidLocalizedPath</b> checks that a localized path is
                correct for the chosen language: paths claimed by this
                language's mappings must round-trip exactly through
                <code>toLocalized(toCanonical(path, lang), lang)</code>, other
                languages' slugs are rejected, and canonical paths are rejected
                when the language localizes them elsewhere.
            </li>
            <li>
                <b>PREFIX_RULE.apply</b> adds the language prefix if required: non‑default
                languages are always prefixed; the default language is prefixed only
                if configured.
            </li>
        </ul>
        <p class="text-xs mt-2 opacity-80">
            Placeholders:
            <code>{`{slug}`}</code> matches a single path segment;
            <code>{`{...rest}`}</code> matches multiple segments (e.g.,
            <code>/rest/a/b/c/last</code> →
            <code>/poljubno/a/b/c/zadnje</code> in Slovenian).
        </p>
    </div>

    <div class="border border-black/10 p-5 rounded-2xl flex flex-col gap-2">
        <div class="text-sm text-blue-500">
            <p>
                <span class="font-medium">DEFAULT_LANG:</span>
                <code class="bg-blue-100 px-1 py-0.5 rounded"
                    >{DEFAULT_LANG}</code
                >
                ·
                <span class="font-medium">PREFIX_DEFAULT:</span>
                <code class="bg-blue-100 px-1 py-0.5 rounded"
                    >{String(PREFIX_DEFAULT)}</code
                >
            </p>
            <p>
                The default language {PREFIX_DEFAULT
                    ? "uses a prefix"
                    : "has no prefix"} in URLs.
            </p>
        </div>
        <hr class="border-t border-black/10 my-2" />
        <div class="flex flex-wrap items-center gap-6 mb-2">
            <label class="flex items-center sm:gap-3 flex-wrap">
                Path:
                <input
                    class="border border-black/30 px-2 py-1.5 rounded-lg w-full sm:w-fit h-10"
                    bind:value={inputPath}
                    placeholder="/pages"
                />
            </label>
            <label class="flex items-center sm:gap-3 flex-wrap">
                Language:
                <select
                    class="border border-black/30 px-2 py-1.5 rounded-lg w-full sm:w-fit h-10"
                    bind:value={lang}
                >
                    {#each languages as l (l)}
                        <option value={l}>{l}</option>
                    {/each}
                </select>
            </label>
        </div>
        <div class="text-sm space-y-1">
            <div class="font-medium">
                📝 Tip: Enter the path <b>without</b> the language prefix. The final
                card shows the fully prefixed URL.
            </div>
            <div class="text-xs opacity-70">
                Examples: /pages/query, /rest/dynamic, /rest/a/b/c/last,
                /strani/poizvedba
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {@render card(
            "normalizePath(input)",
            normalizePath(inputPath),
            "Ensures the input starts with <code>/</code> and removes trailing slashes (but keeps <code>/</code> intact for the root path)."
        )}

        {@render card(
            "toLocalized(canonical, lang)",
            localized,
            "Converts the canonical English path to the selected language using the same mappings (preserves captured placeholder values)"
        )}

        {@render card(
            "toCanonical(input, lang)",
            canonical,
            "Converts a localized path (slugs in the chosen language) to the canonical English path using mappings from <code>src/lib/i18n/routes.js</code>. Works with placeholders like <code>{`{slug}`}</code> and <code>{`{...rest}`}</code>."
        )}

        {@render card(
            "isValidLocalizedPath(input, lang)",
            fmt(valid),
            "Returns <code>true</code> when the path round-trips through <code>toLocalized(toCanonical(path, lang), lang)</code>, is not another language’s slug, and is not a canonical path that this language localizes elsewhere."
        )}

        {@render card(
            "PREFIX_RULE.apply(localized, lang)",
            prefixed,
            "Produces the final URL path by adding the language prefix when required. Non‑default languages are always prefixed; the default language is prefixed only if configured."
        )}
    </div>
</section>

<!-- SNIPPETS -->

<!-- note: description is rendered with {@html} — static literals only -->
{#snippet card(
    /** @type {string} */ title,
    /** @type {string} */ input,
    /** @type {string} */ description
)}
    <div class="border border-black/10 p-5 rounded-2xl flex flex-col gap-2">
        <h2 class="text-lg font-bold">
            {title}
        </h2>
        <div class="bg-gray-100 p-3 rounded-xl font-mono text-sm">
            {input}
        </div>
        <p class="text-sm opacity-70 italic">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- static literals only -->
            {@html description}
        </p>
    </div>
{/snippet}
