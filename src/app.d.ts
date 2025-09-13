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
            /** Server-side translator bound to the active language */
            t: (key: string, vars?: Record<string, string | number>) => string;
            /** Convenience bundle for consumers that prefer a single object */
            i18n: { lang: string; intlLocale: string };
        }
        interface PageData {
            /** Active language on the client */
            lang?: string;
            /** BCP‑47 locale for Intl.* on the client */
            intlLocale?: string;
        }
        // interface PageState {}
        // interface Platform {}
    }
}

export {};
