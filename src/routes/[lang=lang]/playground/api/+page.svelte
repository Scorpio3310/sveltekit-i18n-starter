<script>
    import { page } from "$app/state";
    import { t, translatePathFor } from "$i18n/i18n";

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
     * from src/i18n/routes.js (e.g., '/server/simple' → '/sl/streznik/enostaven').
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

    /** Build a full localized URL with optional query string. */
    function buildLocalizedUrl(canonicalPath, queryString) {
        const base = translatePathFor(canonicalPath, page.params.lang);
        const qs = queryString?.trim() ? `?${queryString}` : "";
        return `${base}${qs}`;
    }

    /** Clean path by removing leading/trailing slashes. */
    function cleanPath(path) {
        return path.replace(/^\/+|\/+$/g, "");
    }

    /** Pretty-print JSON for display. */
    function formatJson(obj) {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return String(obj);
        }
    }

    /** Generic API call helper. */
    async function callApi(resultKey, path, queryParams, options = {}) {
        const url = buildLocalizedUrl(path, queryParams);
        appState.results[resultKey].url = url;

        const res = await fetch(url, options);
        const data = await res.json();
        appState.results[resultKey].response = formatJson(data);
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
        } catch (e) {
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

<svelte:head>
    <title>API Sandbox</title>
</svelte:head>

<section class="grid gap-4">
    <h1 class="text-5xl font-bold my-5">🚀 API Sandbox (Server)</h1>
    <div
        class="bg-blue-50 text-blue-400 rounded-2xl font-semibold py-4 px-6 w-fit justify-self-center mb-4"
    >
        {t("playground.notTranslated")}
    </div>
    <div class="grid max-w-3xl mx-auto gap-4 w-full">
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

{#snippet card(title, description, content)}
    <div class="border border-black/10 p-5 rounded-4xl flex flex-col gap-2">
        <h2 class="text-xl font-bold">
            {title}
        </h2>
        <p class="text-sm opacity-70">{@html description}</p>
        {@render content()}
    </div>
{/snippet}

{#snippet simpleContent()}
    <label class="flex items-center sm:gap-3 flex-wrap">
        Query string (key=value&...):
        <input
            class="border border-black/30 px-2 py-1.5 rounded-lg w-full sm:w-fit"
            bind:value={appState.inputs.simpleQueryParams}
            placeholder="name=Nik"
        />
    </label>

    <button class="button w-fit" onclick={callSimple}>GET /server/simple</button
    >

    {#if appState.results.simple.url}
        <div class="space-y-3 mt-2">
            <hr class="border-t border-black/10" />
            <div class="text-sm">
                <span class="opacity-70">Requested URL:</span>
                <code>{appState.results.simple.url}</code>
            </div>
            <pre
                class="text-xs bg-gray-100 rounded-2xl p-5 grid gap-0.5 overflow-auto">{appState
                    .results.simple.response}</pre>
        </div>
    {/if}
{/snippet}

{#snippet restContent()}
    <label class="flex items-center sm:gap-3 flex-wrap">
        Rest path (a/b/c):
        <input
            class="border border-black/30 px-2 py-1.5 rounded-lg w-full sm:w-fit"
            bind:value={appState.inputs.restPath}
            placeholder="a/b/c"
        />
    </label>

    <label class="flex items-center sm:gap-3 flex-wrap">
        Query string (key=value&...):
        <input
            class="border border-black/30 px-2 py-1.5 rounded-lg w-full sm:w-fit"
            bind:value={appState.inputs.restQueryParams}
            placeholder="x=1&y=2"
        />
    </label>
    <label class="block">
        JSON body for POST:
        <textarea
            class="border border-black/30 px-2 py-1.5 rounded-lg w-full sm:mt-1"
            rows="2"
            bind:value={appState.inputs.jsonBody}
        ></textarea>
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
        <div class="space-y-3 mt-2">
            <hr class="border-t border-black/10" />
            <div class="text-sm">
                <span class="opacity-70">GET Requested URL:</span>
                <code>{appState.results.echo.url}</code>
            </div>
            <pre
                class="text-xs bg-gray-100 rounded-2xl p-5 grid gap-0.5 overflow-auto">{appState
                    .results.echo.response}</pre>
        </div>
    {/if}

    {#if appState.results.post.url}
        <div class="space-y-3 mt-2">
            <hr class="border-t border-black/10" />
            <div class="text-sm">
                <span class="opacity-70">POST Requested URL:</span>
                <code>{appState.results.post.url}</code>
            </div>
            <pre
                class="text-xs bg-gray-100 rounded-2xl p-5 grid gap-0.5 overflow-auto">{appState
                    .results.post.response}</pre>
        </div>
    {/if}
{/snippet}

{#snippet translatedContent()}
    <button class="button w-fit" onclick={callTranslated}
        >GET /server/translated</button
    >

    {#if appState.results.translated.url}
        <div class="space-y-3 mt-2">
            <hr class="border-t border-black/10" />
            <div class="text-sm">
                <span class="opacity-70">Requested URL:</span>
                <code>{appState.results.translated.url}</code>
            </div>
            <pre
                class="text-xs bg-gray-100 rounded-2xl p-5 grid gap-0.5 overflow-auto">{appState
                    .results.translated.response}</pre>
        </div>
    {/if}
{/snippet}
