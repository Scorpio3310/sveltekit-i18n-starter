// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            /** Active language (e.g., 'en' | 'sl' | 'de') */
            lang: string;
            /** BCP‑47 locale for Intl.* API (e.g., 'sl-SI') */
            intlLocale: string;
            /**
             * Server-side translator bound to the active language.
             * Returns the translated string, or the raw dictionary value
             * (array/object/number/boolean) for non-string entries.
             */
            t: (key: string, vars?: Record<string, string | number>) => any;
        }
        interface PageData {
            /** Active language on the client */
            lang?: string;
            /** BCP‑47 locale for Intl.* on the client */
            intlLocale?: string;
            /** Locale-key prefix for <title>/description (see +page.js files) */
            seoKey?: string;
            /** Render a robots noindex meta tag for this page */
            noindex?: boolean;
        }
        // interface PageState {}
        // interface Platform {}
    }
}

export {};
