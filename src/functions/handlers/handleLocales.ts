import en from "../../i18n/locales/en";
import es from "../../i18n/locales/es";

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
    if (!translation || translation[k] === undefined) {
      translation = undefined;
      break;
    }
    translation = translation[k];
  }

  if (typeof translation !== "string") {
    translation = en;
    for (const k of keys) {
      translation = (translation as any)[k];
    }
  }

  if (typeof translation !== "string") return key;

  return Object.entries(replacements).reduce(
    (str, [placeholder, value]) =>
      str.replace(new RegExp(`{${placeholder}}`, "g"), String(value)),
    translation
  );
};

export const translateAttribute = (
  key: TranslationKey
): Record<string, string> => {
  const translations: Record<string, string> = {};
  for (const locale of discordLocales) {
    const baseLang = locale.split("-")[0];

    if (locales[locale] || locales[baseLang]) {
      translations[locale] = translate(locale, key);
    }
  }
  return translations;
};
