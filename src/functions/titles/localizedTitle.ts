import { ProviderType } from "../../constants/providers";

const languageMap: Record<string, string> = {
  "en-US": "en",
  "en-GB": "en",
  "es-ES": "es",
  "es-419": "es",
};

interface GenericAttributesTitle {
  attributes?: {
    title?: Record<string, string>;
    altTitles?: Record<string, string>[];
  };
}

interface MangaBakaTitleItem {
  language: string;
  traits: string[];
  title: string;
  note: string | null;
  is_primary: boolean;
}

interface MangaBakaData {
  title?: string;
  native_title?: string;
  romanized_title?: string;
  titles?: MangaBakaTitleItem[];
}

type TitlePayload = GenericAttributesTitle & MangaBakaData & any;

export default function getLocalizedTitle(
  title: TitlePayload,
  type: ProviderType,
  locale: string
): string | null {
  if (!title) return null;

  const mappedLocale = languageMap[locale] || locale;

  switch (type) {
    case "mangabaka":
      return getMangaBakaTitle(title, mappedLocale);
    case "mangadex":
      return getMangaDexTitle(title, mappedLocale);
    case "namicomi":
      return getNamiComiTitle(title, mappedLocale);
    default:
      return null;
  }
}

const getMangaBakaTitle = (
  data: MangaBakaData,
  locale: string
): string | null => {
  if (!data.titles || !Array.isArray(data.titles)) {
    return data.title || data.romanized_title || data.native_title || null;
  }

  let matchingTitles = data.titles.filter((t) => t.language === locale);

  if (matchingTitles.length === 0 && locale === "es") {
    matchingTitles = data.titles.filter(
      (t) => t.language === "es-la" || t.language === "es-es"
    );
  }

  if (matchingTitles.length > 0) {
    const primaryMatch = matchingTitles.find((t) => t.is_primary);
    if (primaryMatch) return primaryMatch.title;

    const officialMatch = matchingTitles.find((t) => t.traits.includes("official"));
    if (officialMatch) return officialMatch.title;

    const nativeMatch = matchingTitles.find((t) => t.traits.includes("native"));
    if (nativeMatch) return nativeMatch.title;

    const altMatch = matchingTitles.find((t) => t.traits.length > 0);
    if (altMatch) return altMatch.title;

    const noTraitMatch = matchingTitles.find((t) => t.traits.length === 0);
    if (noTraitMatch) return noTraitMatch.title;

    return matchingTitles[0].title;
  }

  return data.title || data.romanized_title || data.native_title || null;
};

const getMangaDexTitle = (
  title: GenericAttributesTitle,
  locale: string
): string | null => {
  const titleObj = title.attributes?.title;
  const altTitles = title.attributes?.altTitles;

  const findTitle = (targetLocale: string): string | null => {
    if (titleObj?.[targetLocale]) return titleObj[targetLocale];
    if (altTitles) {
      const match = altTitles.find((alt) => alt[targetLocale] !== undefined);
      if (match) return match[targetLocale];
    }
    return null;
  };

  let localizedTitle = findTitle(locale);
  if (!localizedTitle && locale === "es") localizedTitle = findTitle("es-la"); // Fallback for "Spanish (LATAM)"
  if (!localizedTitle && titleObj)
    localizedTitle = titleObj[Object.keys(titleObj)[0]];

  return localizedTitle || null;
};

const getNamiComiTitle = (
  title: GenericAttributesTitle,
  locale: string
): string | null => {
  const titleObj = title.attributes?.title;
  if (!titleObj) return null;

  let targetLocale = locale;
  if (targetLocale === "es") targetLocale = "es-es"; // I'm still feeling scammed by this, shame on you Toni (hmph! >:c)

  let localizedTitle = titleObj[targetLocale];
  if (!localizedTitle && targetLocale === "es-es")
    localizedTitle = titleObj["es-419"];
  if (!localizedTitle) localizedTitle = titleObj["en"];
  if (!localizedTitle) localizedTitle = titleObj[Object.keys(titleObj)[0]];

  return localizedTitle || null;
};
