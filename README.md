# 🌍 SvelteKit i18n Starter

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Svelte](https://img.shields.io/badge/Svelte-5-orange.svg)
![SvelteKit](https://img.shields.io/badge/SvelteKit-2-orange.svg)

**Keywords:** `sveltekit` • `svelte` • `i18n` • `internationalization` • `multilingual` • `url localization` • `seo` • `tailwind css`

## 🌐 [Live Demo](https://sveltekit-i18n-starter.klemenc.dev)

URL-driven localization for SvelteKit 2 + Svelte 5. Localized slugs, strict
mapping under `routes/[lang=lang]`, lazy-loaded dictionaries, SEO built in
(hreflang, canonical, sitemap), and a single source of truth for languages —
no i18n runtime dependency.

## 🚀 Features

- **Localized slugs** — data-only mapping in `src/lib/i18n/routes.js`
  (`/pages/query` ↔ `/strani/poizvedba` ↔ `/seiten/abfrage`), with
  `{slug}` and multi-segment `{...rest}` placeholders and
  specificity-aware matching (unit-tested)
- **Blog with translated content slugs** — markdown posts (mdsvex) whose
  URL slug differs per language (`/blog/ai-in-education` ↔
  `/sl/blog/ui-v-izobrazevanju`), linked by a shared `linkedContent`
  frontmatter key — the same model as
  [astro-i18n-starter](https://github.com/Scorpio3310/astro-i18n-starter).
  Correct hreflang + language switching for those slugs, partial
  translations, localized pagination, per-language RSS
- **Reactive translations** — the documented Svelte 5 context-getter
  pattern: language switches update the whole page client-side, no reload
- **Lazy dictionaries** — each language's JSON is its own chunk; visitors
  download only the active language (+ default as missing-key fallback)
- **Language detection** — on `/` only: `lang` cookie → `Accept-Language`
  → default; deep URLs never redirect, so localized URLs stay stable
- **SEO suite** — per-page `<title>`/description via `+page.js`, hreflang
  alternates + `x-default`, canonical URLs, OG/Twitter tags, per-language
  `sitemap.xml`, environment-aware `robots.txt`, 308 canonicalization
  redirects, translated 404 pages
- **Accessible navigation** — keyboard-operable mobile menu
  (`aria-expanded`), focus-visible dropdowns, semantic markup
- **Tooling** — vitest unit tests (routing, negotiation, hooks, blog
  content consistency), eslint, prettier, GitHub Actions CI
- Playground pages: `/playground/api` and `/playground/i18n`

![Overview](static/img_github.jpg)

## ⚡ Quick Start

```bash
pnpm install
pnpm dev
```

That's it — the starter runs without any configuration.

### Configure env (optional)

Environment variables are read via `$env/dynamic/*` with safe defaults, so
`.env` is genuinely optional:

```bash
cp .env.example .env
```

| Variable                       | Default | Purpose                                                      |
| ------------------------------ | ------- | ------------------------------------------------------------ |
| `PUBLIC_DEFAULT_LOCALE`        | `en`    | Language served at `/`                                       |
| `PUBLIC_PREFIX_DEFAULT_LOCALE` | `false` | `true` → default language also lives under `/<lang>`         |
| `PRODUCTION_DOMAIN`            | —       | Exact host that gets the production (allow-all) `robots.txt` |

## 🌐 URL Model

- Default language lives at root (`/`) by default; other languages under
  `/<lang>/…` (`/sl/…`, `/de/…`).
- Prefix mode (`PUBLIC_PREFIX_DEFAULT_LOCALE=true`) puts the default
  language under `/<lang>` too.
- Only the `routes/[lang=lang]` branch is localized. Root-level endpoints
  (`/robots.txt`, `/sitemap.xml`, `/external`, `/favicon.ico`) are never
  redirected or blocked by i18n logic.

Redirects & detection:

| Request                         | Behavior                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` (external entry)            | 302 to the negotiated language (`lang` cookie → `Accept-Language`)                                                                                    |
| `/` (in-app navigation)         | serves the default language and updates the cookie — clicking the default language in the switcher is an explicit choice, not a case for re-detection |
| `/en/pages` (prefix mode OFF)   | 308 to `/pages` (query preserved)                                                                                                                     |
| `/pages` (prefix mode ON)       | 308 to `/en/pages`                                                                                                                                    |
| `/sl/pages/query`               | 404 — canonical slugs are invalid where a localized mapping exists                                                                                    |
| `/strani/poizvedba` (under `/`) | 404 — foreign localized slugs are invalid under the default language                                                                                  |

The `lang` cookie is refreshed on every localized page view, so switching
languages in the navbar is remembered on the next visit to `/`.

## 📁 Files & Responsibilities

- `src/lib/i18n/languages.js` — `LANGUAGES` metadata and derived
  `SUPPORTED_LANGS`. **Single place to add/remove languages.**
- `src/lib/i18n/routes.js` — `ROUTE_SLUGS`, the data-only slug map. Keys
  are canonical (EN) paths, values are localized paths per language; omit
  languages whose slug equals the canonical.
- `src/lib/i18n/routing.js` — pure routing helpers, precompiled per
  language:
    - `toLocalized(path, lang)` / `toCanonical(path, lang)` — preserve
      placeholder values, remainder segments and query/hash; match on the
      raw encoded path so `%`-containing dynamic slugs survive untouched
      (localized slug _mappings_ are ASCII by contract — see `routes.js`)
    - `isValidLocalizedPath(path, lang)` — round-trip validation +
      foreign-slug rejection
    - `switchLanguageUrl(currentHref, fromLang, toLang)` — language
      switcher preserving query/hash
    - `compareRouteSpecificity(a, b)` — static > `{slug}` > `{...rest}`,
      longer shapes first (see Route Mapping Rules)
- `src/lib/i18n/i18n.js` — dictionaries and the reactive context:
    - `loadDict(lang)` — lazy per-language dictionary (own Vite chunk),
      deep-merged over the default language as fallback
    - `setI18nContext(getLang, getDict)` — called once in the root layout
    - `useT()` / `useTranslatePath()` / `useI18n()` — component APIs
      (fetch at init, call in templates; reactive to language changes)
    - `translatePathFor(path, lang)` / `makeT(dict)` — explicit-language
      variants, safe in event handlers and on the server
- `src/lib/i18n/negotiate.js` — `negotiateLanguage(header, supported)`,
  pure `Accept-Language` parsing (q-values, region collapse)
- `src/hooks.js` — universal `reroute`: maps localized URLs onto the
  canonical `[lang=lang]` pages; exports the known-page helpers reused by
  the redirects and the sitemap
- `src/hooks.server.js` — language resolution, detection on `/`,
  canonicalization redirects, `lang` cookie, `locals.{lang,intlLocale,t}`,
  `<html lang>` via `transformPageChunk`
- `src/routes/+layout.server.js` → `{ lang, intlLocale }`;
  `src/routes/+layout.js` → attaches the lazy `dict`
- `src/routes/+layout.svelte` — installs the i18n context and renders the
  single SEO head (title/description from each page's `seoKey`, hreflang,
  canonical, OG/Twitter)
- `src/routes/[lang=lang]/+layout.server.js` — localized-path validation
  (a 404 here renders the translated `+error.svelte`, unlike errors
  thrown in `handle`)
- `src/routes/sitemap.xml/+server.js` — per-language sitemap with
  hreflang alternates (static pages + blog posts);
  `src/routes/robots.txt/+server.js` — serves the allow-all file only on
  the exact `PRODUCTION_DOMAIN` host
- `src/lib/content/blog.js` + `src/lib/content/blog/<lang>/*.md` — the
  blog content collection (see the Blog section below)
- `src/routes/[lang=lang]/blog/…` — blog index, localized pagination
  (`/blog/page/{n}`) and post pages;
  `src/routes/[lang=lang]/rss.xml/+server.js` — per-language RSS feed

## 🧭 Route Mapping Rules

- Placeholders are in braces and always span a full segment:
    - single segment: `/pages/{slug}` ↔ `/strani/{slug}`
    - multi-segment: `/rest/{...rest}/last` ↔ `/poljubno/{...rest}/zadnje`
- **Matching precedence is by specificity, not string length**: static
  segments beat `{slug}`, `{slug}` beats `{...rest}`, and longer shapes
  beat their prefixes. So `/pages/query` → `/strani/poizvedba` even
  though `/pages/{slug}` also matches, and `/rest/dynamic` overrides
  `/rest/{...rest}`.
- Both sides of an entry must use the same placeholder names.
- Default language (prefix OFF) lives at root with canonical slugs;
  foreign localized slugs 404 there. Non-default languages are served
  only under `/<lang>/…`; canonical forms 404 wherever a localized
  mapping exists.

## 🔗 Usage

Translating text and building links in components:

```svelte
<script>
    import { useT, useTranslatePath } from "$i18n/i18n";

    const t = useT();
    const translatePath = useTranslatePath();
</script>

<h1>{t("home.h1")}</h1>
<p>{t("footer.made", { what: "SvelteKit" })}</p>

<a href={translatePath("/pages/query")}>Query demo</a>
```

`useT()`/`useTranslatePath()` must be called during component init (they
read Svelte context); the returned functions are stable and reactive — call
them anywhere, including event handlers.

Explicit language (no context needed):

```svelte
<script>
    import { goto } from "$app/navigation";
    import { translatePathFor, switchLanguageUrl } from "$i18n/i18n";
    import { page } from "$app/state";
</script>

<button onclick={() => goto(translatePathFor("/pages/simple", "sl"))}>
    Open Slovenian page
</button>

<!-- language switcher (preserves query + hash) -->
<a
    href={switchLanguageUrl(
        page.url.pathname + page.url.search,
        undefined,
        "sl"
    )}
>
    SL
</a>
```

Server-side (`locals` is set for all endpoints and server loads):

```js
import { json } from "@sveltejs/kit";

/** @type {import('./$types').RequestHandler} */
export function GET({ locals }) {
    return json({
        lang: locals.lang,
        intlLocale: locals.intlLocale,
        title: locals.t("home.head.title"),
    });
}
```

## 🔍 SEO

Each page declares its metadata in a tiny `+page.js`:

```js
/** @type {import('./$types').PageLoad} */
export function load() {
    return { seoKey: "pageSimple" }; // add `noindex: true` to opt out
}
```

The root layout renders one `<title>`/description pair from
`<seoKey>.head.*` in the active language, plus canonical, hreflang
alternates (`en`/`sl`/`de` + `x-default`), OG and Twitter tags.
`sitemap.xml` lists every static localized page with hreflang alternates,
and `robots.txt` only allows crawling on the configured production host —
previews and staging stay unindexed.

Content pages can override the dictionary lookup: a load may return
`seoTitle`/`seoDescription` (per-document copy) and `langAlternates`
(real per-language URLs when the dynamic segment differs per language) —
blog posts use both, see the Blog section.

## ➕ Add a Language

1. Add the code, label and locales in `src/lib/i18n/languages.js`.
2. Add translations under `src/lib/locales/<lang>/*.json` (any number of
   files; they are deep-merged, and missing keys fall back to the default
   language).
3. Optional: add localized slugs in `src/lib/i18n/routes.js`.

## 📄 Add a Localized Page

1. Create the page under `src/routes/[lang=lang]/…` with a `+page.js`
   declaring its `seoKey`, and add the matching `<seoKey>.head.*` keys to
   the locale files.
2. If the slugs should differ per language, add entries to `ROUTE_SLUGS`:

```js
export const ROUTE_SLUGS = {
    sl: {
        "/pages": "/strani",
        "/pages/{slug}": "/strani/{slug}",
    },
};
```

3. Link it with `translatePath("/pages")` — prefixes and localized slugs
   are applied automatically.

## 📝 Blog: Translated Content Slugs

`ROUTE_SLUGS` translates route _structure_; a `{slug}` value passes
through verbatim. Blog posts need more: the slug itself is content and
differs per language. The blog demo solves that with the same model as
[astro-i18n-starter](https://github.com/Scorpio3310/astro-i18n-starter) —
one folder per language, the **file name is that language's slug**, and
translations declare a shared `linkedContent` frontmatter key:

```
src/lib/content/blog/
├── en/ai-in-education.md        linkedContent: "ai-in-education"
├── sl/ui-v-izobrazevanju.md     linkedContent: "ai-in-education"
└── de/ki-in-der-bildung.md      linkedContent: "ai-in-education"
```

```md
---
title: "AI in Education: Transforming Learning Experiences"
linkedContent: "ai-in-education"
description: "How AI is changing the way we teach and learn."
author: "Nik Klemenc"
pubDate: "2026-07-12"
isDraft: false
---

## Introduction

…
```

`src/lib/content/blog.js` derives the `linkedContent → { lang: slug }`
map from the collection (lazily, cached) and everything else flows from
it:

- **Language switching & hreflang** — the post's server load returns
  `langAlternates` (each language's real URL); the layout emits hreflang
  only for languages the post exists in, and the navbar switcher prefers
  the alternate, falling back to that language's `/blog` index for
  missing translations. Try it: `design-systems-2026` is deliberately
  untranslated in German.
- **404s** — a slug that doesn't exist in the URL's language (including
  another language's slug, e.g. `/sl/blog/ai-in-education`) renders the
  translated 404 page.
- **Pagination** — `/blog` is page 1; deeper pages live at
  `/blog/page/2` with the segment localized via `ROUTE_SLUGS`
  (`/sl/blog/stran/2`, `/de/blog/seite/2`); `/blog/page/1` 308-redirects
  to `/blog`.
- **Sitemap & RSS** — posts appear in `sitemap.xml` with real
  per-language slugs and partial hreflang sets; each language has a feed
  at `/rss.xml` (default) / `/<lang>/rss.xml`.

**Add a post:** drop a `.md` file into each language folder (file name =
that language's slug) with the same `linkedContent` key. A typo in the
key doesn't break the build — it silently unlinks the translation — so
`src/lib/content/blog.test.js` fails the test suite for unknown keys,
duplicates and missing frontmatter.

The posts are compiled by [mdsvex](https://mdsvex.pngwn.io) — the only
dependency the blog demo adds (a dev dependency; the i18n core remains
dependency-free). Delete `src/lib/content` and the `blog`/`rss.xml`
routes to drop the demo.

## 🧪 Tests, Lint & Playgrounds

```bash
pnpm test     # vitest — slug matching, validation, Accept-Language parsing
pnpm check    # svelte-check (strict, checkJs)
pnpm lint     # prettier --check + eslint
pnpm format   # prettier --write
```

CI (GitHub Actions) runs lint → check → test → build on every push/PR.

Interactive helpers:

- **API Sandbox** `/playground/api` — call the localized `+server.js`
  endpoints (GET/POST, translated responses via `locals.t`)
- **i18n Playground** `/playground/i18n` — inspect `toCanonical`,
  `toLocalized`, `isValidLocalizedPath` and prefixing live

## 🛠️ Development & Build

```bash
pnpm dev            # start dev server
pnpm build          # build for production
pnpm preview        # preview built app
```

Adapter: `@sveltejs/adapter-auto` (serverless — Vercel/Netlify/Cloudflare
etc.). The i18n redirects, validation, detection and dynamic
robots/sitemap run at request time, so this starter needs a server
runtime — it is **not** a static-site generator. If you must prerender,
you'll need to rethink the redirect/validation layer.

## ℹ️ Design Notes

- `src/lib/i18n/routes.js` is data-only: no Svelte imports, no logic.
- Language detection happens **only** on `/`; every other URL is stable
  and crawler-friendly. Delete the detection block in
  `src/hooks.server.js` if you want pure URL-driven language selection.
- A URL with no valid language prefix that doesn't resolve to a page
  (e.g. `/de1`) 404s in the **visitor's** language (cookie →
  Accept-Language → default), so the error page matches what they were
  browsing. Successful pages are always language-pinned by their URL.
- `+error.svelte` is the localized error page for 404s and load errors;
  `src/error.html` is SvelteKit's static fallback, shown only if the app
  itself can't render (an error in the `handle` hook or root layout). It's
  optional — delete it to fall back to SvelteKit's built-in default.
- Links are built by the i18n helpers rather than SvelteKit's `resolve()`
  — this starter doesn't use a base path. Re-enable the
  `svelte/no-navigation-without-resolve` eslint rule if yours does.
- The `/external` route demonstrates a page outside `[lang=lang]` driving
  its own translator with `loadDict`/`makeT`.
- Looking for a batteries-included alternative? The official
  [`sv add paraglide`](https://svelte.dev/docs/cli/paraglide) integration
  offers compiled, type-safe messages. This starter exists for the
  opposite trade-off: fully transparent, dependency-free localized
  routing you can read end-to-end.
