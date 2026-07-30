import en from "../../i18n/locales/en";
import es from "../../i18n/locales/es";
import eu from "../../i18n/locales/eu";
import ja from "../../i18n/locales/ja";

import { TranslationKey } from "../../utils/i18n";
import { BotStrings, PartialBotStrings } from "../../i18n/schema";

const discordLocales: string[] = [
  "id",
  "da",
  "de",
  "en-GB",
  "en-US",
  "es-ES",
  "es-419",
  "fr",
  "hr",
  "it",
  "lt",
  "hu",
  "nl",
  "no",
  "pl",
  "pt-BR",
  "ro",
  "fi",
  "sv-SE",
  "vi",
  "tr",
  "cs",
  "el",
  "bg",
  "ru",
  "uk",
  "hi",
  "th",
  "zh-CN",
  "ja",
  "zh-TW",
  "ko",
];

const locales: Record<string, PartialBotStrings | BotStrings> = {
  en: en,
  "en-GB": en,
  "en-US": en,
  es: es,
  "es-ES": es,
  "es-419": es,
  eu: eu,
  ja: ja,
};

export const format = (
  text: string,
  replacements: Record<string, string | number> = {}
): string => {
  return Object.entries(replacements).reduce(
    (str, [placeholder, value]) =>
      str.replaceAll(`{${placeholder}}`, String(value)),
    text
  );
};

export const translate = (
  locale: string,
  key: TranslationKey,
  replacements: Record<string, string | number> = {}
): string => {
  const dictionary = locales[locale] || locales["en"];
  const keys = key.split(".");

  let translation: any = dictionary;
  for (const k of keys) {
    translation = translation?.[k];
    if (translation === undefined) break;
  }

  if (typeof translation !== "string" || translation === "") {
    let fallback: any = en;
    for (const k of keys) {
      if (!fallback || (fallback as any)[k] === undefined) {
        fallback = undefined;
        break;
      }
      fallback = (fallback as any)[k];
    }
    if (typeof fallback === "string" && fallback !== "") translation = fallback;
  }

  if (typeof translation !== "string" || translation === "") return key;

  return format(translation, replacements);
};

export const translateAttribute = (
  selector: (t: BotStrings) => string
): Record<string, string> => {
  const translations: Record<string, string> = {};
  for (const locale of discordLocales) {
    const t = getTranslations(locale);
    translations[locale] = selector(t);
  }
  return translations;
};

/**
 * Retrieves the full translations object for a given locale,
 * falling back to English for any missing keys.
 */
export const getTranslations = (locale: string): BotStrings => {
  const dictionary = locales[locale] || locales["en"];
  if (dictionary === en) return en as BotStrings;

  return deepMerge(en, dictionary) as BotStrings;
};

/**
 * Returns the list of available locales with their metadata.
 */
export const getAvailableLocales = (): Array<{
  name: string;
  code: string;
  enabled: boolean;
}> => {
  const seen = new Set<string>();
  const result: Array<{ name: string; code: string; enabled: boolean }> = [];

  for (const dict of Object.values(locales)) {
    const loc = dict.locale;
    if (!loc?.code || seen.has(loc.code)) continue;
    seen.add(loc.code);
    result.push({
      name: `${loc.name} (${loc.code})`,
      code: loc.code,
      enabled: loc.enabled ?? false,
    });
  }

  return result;
};

function deepMerge(base: any, override: any): any {
  if (
    typeof base !== "object" ||
    base === null ||
    typeof override !== "object" ||
    override === null
  ) {
    return override !== undefined && override !== "" ? override : base;
  }

  const result: any = { ...base };
  for (const key of Object.keys(override)) {
    result[key] = deepMerge(base[key], override[key]);
  }
  return result;
}
