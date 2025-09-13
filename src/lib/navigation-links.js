// Navigation Data - Menu
/**
 * @typedef {{ label: string, href: string, children: { label: string, href: string }[] }} NavItem
 */
/** @type {NavItem[]} */
const navigationData = [
    { label: "menu.home", href: "/", children: [] },

    {
        label: "menu.pages",
        href: "/pages",
        children: [
            { label: "menu.pagesChildren.simple", href: "/pages/simple" },
            {
                label: "menu.pagesChildren.query",
                href: "/pages/query?x=1&y=2",
            },
            { label: "menu.pagesChildren.slug", href: "/pages/this-is-slug" },
            {
                label: "menu.pagesChildren.slugBetween",
                href: "/pages/this-is-slug/last",
            },
        ],
    },

    {
        label: "menu.server",
        href: "/server",
        children: [
            { label: "menu.serverChildren.simple", href: "/server/simple" },
            { label: "menu.serverChildren.rest", href: "/server/rest/a/b?x=1" },
            {
                label: "menu.serverChildren.translated",
                href: "/server/translated",
            },
        ],
    },

    {
        label: "menu.rest",
        href: "/rest",
        children: [
            { label: "menu.restChildren.dynamic", href: "/rest/dynamic/a/b/c" },
            {
                label: "menu.restChildren.restBetween",
                href: "/rest/a/b/c/last",
            },
        ],
    },

    {
        label: "menu.playground",
        href: "/playground",
        children: [
            {
                label: "menu.playgroundChildren.apiSandbox",
                href: "/playground/api",
            },
            {
                label: "menu.playgroundChildren.i18nPlayground",
                href: "/playground/i18n",
            },
        ],
    },
];

export default navigationData;
