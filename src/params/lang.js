// Param matcher for the [lang=lang] route segment.
// Imports only the language registry so the matcher's module graph stays
// tiny (no dictionaries, no svelte).
import { SUPPORTED_LANGS } from "$i18n/languages";

export function match(param) {
    return SUPPORTED_LANGS.includes(param);
}
