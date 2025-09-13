import { languages } from "$i18n/i18n";

export function match(param) {
    return languages.includes(param);
}
