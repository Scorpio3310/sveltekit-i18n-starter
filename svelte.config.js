import adapter from "@sveltejs/adapter-auto";
import { mdsvex } from "mdsvex";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // mdsvex compiles the blog's .md files (src/lib/content/blog) into Svelte
    // components; their frontmatter becomes the module's `metadata` export.
    extensions: [".svelte", ".md"],
    preprocess: [mdsvex({ extensions: [".md"] })],
    kit: {
        // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
        // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
        // See https://svelte.dev/docs/kit/adapters for more information about adapters.
        adapter: adapter(),
        alias: {
            $components: "src/lib/components",
            $i18n: "src/lib/i18n",
        },
    },
};

export default config;
