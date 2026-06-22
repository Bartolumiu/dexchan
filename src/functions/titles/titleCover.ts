import { ProviderType } from "../../constants/providers";
import fetchImageAsBuffer from "../tools/fetchImageAsBuffer";

const LOCALE_MAP: Record<string, string> = {
  "en-US": "en",
  "en-GB": "en",
  "es-ES": "es",
  "es-419": "es",
};

const URL_FORMATS = {
  mangadex: "https://uploads.mangadex.org/covers/",
  namicomi: "https://uploads.namicomi.com/covers/",
} as const;

/**
 * Retrieves the cover image for the given title and type.
 * @param title The title object containing the necessary data.
 * @param type The type of provider (e.g. 'namicomi').
 * @param locale The locale code to retrieve the cover for.
 */
export default async function getCover(
  title: any,
  type: ProviderType,
  locale: string | null = null
): Promise<Buffer | null> {
  const url = buildURL(title, type, locale);
  return fetchImageAsBuffer(url);
}

/**
 * Builds the URL for the cover image based on the title and type.
 * @param title The title object containing the necessary data.
 * @param type The type of provider (e.g. 'namicomi').
 * @param locale The locale code to retrieve the cover for.
 */
const buildURL = (
  title: any,
  type: ProviderType,
  locale: string | null = null
): URL | null => {
  if (!title) return null;

  switch (type) {
    case "mangabaka": {
      const coverUrl = title.cover?.raw?.url;
      return coverUrl ? new URL(coverUrl) : null;
    }
    case "mangadex": {
      const id = title.id;
      if (!id) return null;
      const coverName = title.relationships?.find(
        (rel: any) => rel.type === "cover_art"
      )?.attributes?.fileName;
      if (!coverName) return null;
      return new URL(`${URL_FORMATS.mangadex}${id}/${coverName}.512.jpg`);
    }
    case "namicomi": {
      const normalizedLocale = locale ? LOCALE_MAP[locale] || locale : null;
      const id = title.id;
      if (!id) return null;

      const covers =
        title.relationships?.find((rel: any) => rel.type === "cover_art") || [];
      let coverName = covers.find(
        (rel: any) => rel.attributes?.locale === normalizedLocale
      )?.attributes?.fileName;

      if (!coverName && normalizedLocale === "es") {
        coverName = covers.find(
          (rel: any) => rel.attributes?.locale === "es-419"
        )?.attributes?.fileName;
      }
      if (!coverName && covers.length > 0) {
        coverName = covers[0]?.attributes?.fileName;
      }

      if (!coverName) return null;
      return new URL(`${URL_FORMATS.namicomi}${id}/${coverName}.512.jpg`);
    }
  }
};
