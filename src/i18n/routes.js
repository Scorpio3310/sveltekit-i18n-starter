// Language-specific slug overrides for localized URLs.
// Keys are base paths (English slugs), values are localized slugs per language.
// Omit languages where slugs are identical to base paths (e.g., en).

export const ROUTE_SLUGS = {
    sl: {
        // Rest section
        "/rest/dynamic": "/poljubno/dinamicno",
        "/rest/dynamic/{...rest}": "/poljubno/dinamicno/{...rest}",
        "/rest": "/poljubno",
        "/rest/{...rest}": "/poljubno/{...rest}",
        "/rest/{...rest}/last": "/poljubno/{...rest}/zadnje",

        // Pages section
        "/pages": "/strani",
        "/pages/simple": "/strani/enostavna",
        "/pages/query": "/strani/poizvedba",
        "/pages/{slug}": "/strani/{slug}",
        "/pages/{slug}/last": "/strani/{slug}/zadnje",

        // Server section
        "/server": "/streznik",
        "/server/simple": "/streznik/enostaven",
        "/server/rest": "/streznik/rest",
        "/server/translated": "/streznik/prevedeno",

        // Playground section
        "/playground": "/igrisce",
        "/playground/api": "/igrisce/api",
        "/playground/i18n": "/igrisce/i18n",
    },
    de: {
        // Rest section
        "/rest/dynamic": "/beliebig/dynamisch",
        "/rest/dynamic/{...rest}": "/beliebig/dynamisch/{...rest}",
        "/rest": "/beliebig",
        "/rest/{...rest}": "/beliebig/{...rest}",
        "/rest/{...rest}/last": "/beliebig/{...rest}/letzte",

        // Pages section
        "/pages": "/seiten",
        "/pages/simple": "/seiten/einfach",
        "/pages/query": "/seiten/abfrage",
        "/pages/{slug}": "/seiten/{slug}",
        "/pages/{slug}/last": "/seiten/{slug}/letzte",

        // Server section (ASCII only)
        "/server/simple": "/server/einfach",
        "/server/rest": "/server/rest",
        "/server/translated": "/server/ubersetzt",

        // Playground section
        "/playground": "/spielwiese",
        "/playground/api": "/spielwiese/api",
        "/playground/i18n": "/spielwiese/i18n",
    },
};
