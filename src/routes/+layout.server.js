/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
    const { lang, intlLocale } = locals ?? {};
    return { lang, intlLocale };
}
