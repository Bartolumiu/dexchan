import { ProviderType } from "../../constants/providers";

const languageMap: Record<string, string> = {
  "en-US": "en",
  "en-GB": "en",
  "es-ES": "es",
  "es-419": "es",
};

export interface TitleWithDescription {
  attributes?: {
    description?: Record<string, string>;
  };
}

/**
 * Retrieves a localised description for the given title and locale.
 * @param title The title object containing the description.
 * @param type The source provider
 * @param locale The locale code to retrieve the description for.
 */
export const getLocalizedDescription = (
  title: TitleWithDescription,
  type: ProviderType,
  locale: string
): string | null => {
  const mappedLocale = languageMap[locale] || locale;

  switch (type) {
    case "mangadex":
      return getMangaDexDescription(title, mappedLocale);
    case "namicomi":
      return getNamiComiDescription(title, mappedLocale);
    default:
      return null;
  }
};

/**
 * Retrieves the MangaDex description for the given title and locale.
 * @param title The title object containing the description.
 * @param locale The locale code to retrieve the description for.
 */
const getMangaDexDescription = (
  title: TitleWithDescription,
  locale: string
): string | null => {
  const descriptions = title.attributes?.description;
  if (!descriptions) return null;

  let description = descriptions[locale];
  if (!description && locale === "es") description = descriptions["es-la"];
  if (!description) description = descriptions["en"];

  return description || null;
};

/**
 * Retrieves the NamiComi description for the given title and locale.
 * @param title The title object containing the description.
 * @param locale The locale code to retrieve the description for.
 */
const getNamiComiDescription = (
  title: TitleWithDescription,
  locale: string
): string | null => {
  const descriptions = title.attributes?.description;
  if (!descriptions) return null;

  let targetLocale = locale;
  if (targetLocale === "es") targetLocale = "es-es"; // NamiComi uses 'es-es' for Spanish (I got scammed by this, and I'm not happy about it, hmph >:( )

  let description = descriptions[targetLocale];
  if (!description && targetLocale === "es-es")
    description = descriptions["es-419"];
  if (!description) description = descriptions["en"];

  return description || null;
};
