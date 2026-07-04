import { loadDict } from "$i18n/i18n";

/**
 * Universal load: attaches the active language's dictionary to page data.
 * Runs on the server during SSR (cache hit after the handle hook) and again
 * on the client, where it dynamic-imports ONLY the active language's locale
 * chunk — switching languages loads the new chunk on demand.
 * @type {import('./$types').LayoutLoad}
 */
export async function load({ data }) {
    return {
        ...data,
        dict: await loadDict(data?.lang),
    };
}
