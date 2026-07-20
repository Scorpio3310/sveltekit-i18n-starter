<script>
    import { page } from "$app/state";
    import { useT, translatePathFor } from "$i18n/i18n";
    const t = useT();

    /**
     * API Sandbox usage (Server endpoints)
     *
     * How to run:
     * - Start dev server: `pnpm dev`
     * - Open this page in your browser under any language, e.g.:
     *   - Default language at root
     *   - Prefixed language: `http://localhost:5173/sl/playground/api`
     * - Click the buttons or edit the inputs below to call the +server endpoints.
     *
     * Endpoints included (under routes/[lang=lang]/server):
     * - GET  /server/simple                 → src/routes/[lang=lang]/server/simple/+server.js
     * - GET  /server/rest/[...rest]         → src/routes/[lang=lang]/server/[...rest]/+server.js
     * - POST /server/rest/[...rest]         → src/routes/[lang=lang]/server/[...rest]/+server.js
     * - GET  /server/translated             → src/routes/[lang=lang]/server/translated/+server.js
     *
     * This sandbox uses translatePathFor() so paths automatically localize and
     * add/remove language prefixes based on the active language and mappings
     * from src/lib/i18n/routes.js (e.g., '/server/simple' → '/sl/streznik/enostaven').
     */

    let appState = $state({
        inputs: {
            simpleQueryParams: "name=Nik",
            restPath: "a/b/c",
            restQueryParams: "x=1&y=2",
            jsonBody: '{"hello":"world"}',
        },
        results: {
            simple: { url: "", response: "" },
            echo: { url: "", response: "" },
            post: { url: "", response: "" },
            translated: { url: "", response: "" },
        },
    });

    /**
     * Build a full localized URL with optional query string.
     * @param {string} canonicalPath
     * @param {string=} queryString
     */
    function buildLocalizedUrl(canonicalPath, queryString) {
        const base = translatePathFor(canonicalPath, page.params.lang);
        const qs = queryString?.trim() ? `?${queryString}` : "";
        return `${base}${qs}`;
    }

    /**
     * Clean path by removing leading/trailing slashes.
     * @param {string} path
     */
    function cleanPath(path) {
        return path.replace(/^\/+|\/+$/g, "");
    }

    /**
     * Pretty-print JSON for display.
     * @param {unknown} obj
     */
    function formatJson(obj) {
        try {
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(obj);
        }
    }

    /**
     * Generic API call helper. Failures (network, non-2xx, non-JSON body)
     * are rendered into the result panel instead of rejecting silently.
     * @param {"simple"|"echo"|"post"|"translated"} resultKey
     * @param {string} path
     * @param {string=} queryParams
     * @param {RequestInit=} options
     */
    async function callApi(resultKey, path, queryParams, options = {}) {
        const url = buildLocalizedUrl(path, queryParams);
        appState.results[resultKey].url = url;

        try {
            const res = await fetch(url, options);
            const text = await res.text();
            let pretty = text;
            try {
                pretty = formatJson(JSON.parse(text));
            } catch {
                // non-JSON body — show it as-is
            }
            appState.results[resultKey].response = res.ok
                ? pretty
                : `⚠️ HTTP ${res.status} ${res.statusText}\n\n${pretty}`;
        } catch (err) {
            appState.results[resultKey].response = `⚠️ Request failed: ${
                err instanceof Error ? err.message : String(err)
            }`;
        }
    }

    /** Call GET /server/simple with current query string. */
    async function callSimple() {
        await callApi(
            "simple",
            "/server/simple",
            appState.inputs.simpleQueryParams
        );
    }

    /** Call GET /server/rest/[...rest] with rest segments and query string. */
    async function callRestGet() {
        const path = cleanPath(appState.inputs.restPath);
        await callApi(
            "echo",
            `/server/rest/${path}`,
            appState.inputs.restQueryParams
        );
    }

    /** Call POST /server/rest/[...rest] with JSON body and optional query string. */
    async function callRestPost() {
        const path = cleanPath(appState.inputs.restPath);
        let body;
        try {
            body = JSON.parse(appState.inputs.jsonBody);
        } catch {
            body = { raw: appState.inputs.jsonBody };
        }

        await callApi(
            "post",
            `/server/rest/${path}`,
            appState.inputs.restQueryParams,
            {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            }
        );
    }

    /** Call GET /server/translated */
    async function callTranslated() {
        await callApi("translated", "/server/translated");
    }
</script>

<section class="grid gap-4">
    <h1 class="my-5 text-5xl font-bold">🚀 API Sandbox (Server)</h1>
    <div
        class="mb-4 w-fit justify-self-center rounded-2xl bg-blue-50 px-6 py-4 font-semibold text-blue-400"
    >
        {t("playground.notTranslated")}
    </div>
    <div class="mx-auto grid w-full max-w-3xl gap-4">
        {@render card(
            "Simple Endpoint (GET)",
            "Canonical: <code>/server/simple</code> → localized via translatePath",
            simpleContent
        )}
        {@render card(
            "REST Echo Endpoint (GET & POST)",
            "Canonical: <code>/server/rest/[...rest]</code> → localized via translatePath",
            restContent
        )}
        {@render card(
            "Translated Endpoint (GET)",
            "Canonical: <code>/server/translated</code>",
            translatedContent
        )}
    </div>
</section>

<!-- SNIPPETS -->

<!-- note: description is rendered with {@html} — static literals only -->
{#snippet card(
    /** @type {string} */ title,
    /** @type {string} */ description,
    /** @type {import('svelte').Snippet} */ content
)}
    <div class="flex flex-col gap-2 rounded-4xl border border-black/10 p-5">
        <h2 class="text-xl font-bold">
            {title}
        </h2>
        <p class="text-sm opacity-70">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- static literals only -->
            {@html description}
        </p>
        {@render content()}
    </div>
{/snippet}

{#snippet simpleContent()}
    <label class="flex flex-wrap items-center sm:gap-3">
        Query string (key=value&...):
        <input
            class="w-full rounded-lg border border-black/30 px-2 py-1.5 sm:w-fit"
            bind:value={appState.inputs.simpleQueryParams}
            placeholder="name=Nik"
        />
    </label>

    <button class="button w-fit" onclick={callSimple}>GET /server/simple</button
    >

    {#if appState.results.simple.url}
        <div class="mt-2 space-y-3">
            <hr class="border-t border-black/10" />
            <div class="text-sm">
                <span class="opacity-70">Requested URL:</span>
                <code>{appState.results.simple.url}</code>
            </div>
            <pre
                class="grid gap-0.5 overflow-auto rounded-2xl bg-gray-100 p-5 text-xs">{appState
                    .results.simple.response}</pre>
        </div>
    {/if}
{/snippet}

{#snippet restContent()}
    <label class="flex flex-wrap items-center sm:gap-3">
        Rest path (a/b/c):
        <input
            class="w-full rounded-lg border border-black/30 px-2 py-1.5 sm:w-fit"
            bind:value={appState.inputs.restPath}
            placeholder="a/b/c"
        />
    </label>

    <label class="flex flex-wrap items-center sm:gap-3">
        Query string (key=value&...):
        <input
            class="w-full rounded-lg border border-black/30 px-2 py-1.5 sm:w-fit"
            bind:value={appState.inputs.restQueryParams}
            placeholder="x=1&y=2"
        />
    </label>
    <label class="block">
        JSON body for POST:
        <textarea
            class="w-full rounded-lg border border-black/30 px-2 py-1.5 sm:mt-1"
            rows="2"
            bind:value={appState.inputs.jsonBody}></textarea>
    </label>

    <div class="flex flex-wrap gap-2">
        <button class="button w-fit" onclick={callRestGet}
            >GET /server/rest/[...rest]</button
        >
        <button class="button w-fit" onclick={callRestPost}
            >POST /server/rest/[...rest]</button
        >
    </div>

    {#if appState.results.echo.url}
        <div class="mt-2 space-y-3">
            <hr class="border-t border-black/10" />
            <div class="text-sm">
                <span class="opacity-70">GET Requested URL:</span>
                <code>{appState.results.echo.url}</code>
            </div>
            <pre
                class="grid gap-0.5 overflow-auto rounded-2xl bg-gray-100 p-5 text-xs">{appState
                    .results.echo.response}</pre>
        </div>
    {/if}

    {#if appState.results.post.url}
        <div class="mt-2 space-y-3">
            <hr class="border-t border-black/10" />
            <div class="text-sm">
                <span class="opacity-70">POST Requested URL:</span>
                <code>{appState.results.post.url}</code>
            </div>
            <pre
                class="grid gap-0.5 overflow-auto rounded-2xl bg-gray-100 p-5 text-xs">{appState
                    .results.post.response}</pre>
        </div>
    {/if}
{/snippet}

{#snippet translatedContent()}
    <button class="button w-fit" onclick={callTranslated}
        >GET /server/translated</button
    >

    {#if appState.results.translated.url}
        <div class="mt-2 space-y-3">
            <hr class="border-t border-black/10" />
            <div class="text-sm">
                <span class="opacity-70">Requested URL:</span>
                <code>{appState.results.translated.url}</code>
            </div>
            <pre
                class="grid gap-0.5 overflow-auto rounded-2xl bg-gray-100 p-5 text-xs">{appState
                    .results.translated.response}</pre>
        </div>
    {/if}
{/snippet}
