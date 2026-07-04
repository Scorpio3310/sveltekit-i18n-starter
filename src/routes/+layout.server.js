/**
 * Root layout data. `lang`/`intlLocale` are derived from the URL by the
 * handle hook and exposed on `locals`.
 *
 * Reading `url` is essential: without a tracked url/params dependency,
 * SvelteKit would NOT re-run this load on client-side navigation, so
 * `data.lang` (and the whole i18n context built from it) would stay frozen
 * at the first-loaded language until a full reload.
 * @type {import('./$types').LayoutServerLoad}
 */
export function load({ locals, url }) {
    void url.pathname; // register the URL dependency (see above)
    return {
        lang: locals.lang,
        intlLocale: locals.intlLocale,
    };
}
