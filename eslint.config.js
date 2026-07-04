import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: [".svelte-kit/", "build/", "node_modules/"],
    },
    js.configs.recommended,
    ...svelte.configs.recommended,
    prettier,
    ...svelte.configs.prettier,
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },
    {
        rules: {
            // Links are produced by the i18n helpers (translatePath/
            // switchLanguageUrl), which return final localized pathnames.
            // resolve() adds base-path handling this starter doesn't use —
            // re-enable it if you deploy under a base path.
            "svelte/no-navigation-without-resolve": "off",
        },
    },
];
