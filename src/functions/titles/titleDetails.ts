import { ProviderType } from "../../constants/providers";
import fetchJSON from "../tools/fetchJSON";

const URL_FORMATS = {
  mangabaka: "https://api.mangabaka.org/v1/series/",
  mangadex: "https://api.mangadex.org/manga/",
  namicomi: "https://api.namicomi.com/title/",
} as const;

/**
 * Retrieves details for a given ID based on the specific provider.
 * @param id The ID of the title.
 * @param type The type of provider (e.g. 'mangadex').
 */
export default async function getTitleDetails(
  id: string | number,
  type: ProviderType
): Promise<any | null> {
  const url = buildUrl(id, type);
  if (!url) return null;

  const response = await fetchJSON(url);
  return response?.data || null;
}

/**
 * Builds a URL object by appending specific search parameters based on the given type.
 * @param id The ID of the title.
 * @param type The type of provider (e.g. 'mangadex').
 */
const buildUrl = (id: string | number, type: ProviderType): URL | null => {
  if (!id) return null;

  switch (type) {
    case "mangabaka":
      return new URL(`${URL_FORMATS.mangabaka}${id}`);
    case "mangadex": {
      const url = new URL(`${URL_FORMATS.mangadex}${id}`);
      url.searchParams.append("includes[]", "author");
      url.searchParams.append("includes[]", "artist");
      url.searchParams.append("includes[]", "cover_art");
      url.searchParams.append("includes[]", "tag");
      return url;
    }
    case "namicomi": {
      const url = new URL(`${URL_FORMATS.namicomi}${id}`);
      url.searchParams.append("includes[]", "organization");
      url.searchParams.append("includes[]", "cover_art");
      url.searchParams.append("includes[]", "tag");
      return url;
    }
    default:
      return null;
  }
};
