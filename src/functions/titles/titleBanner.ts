import { ProviderType } from "../../constants/providers";
import fetchImageAsBuffer from "../tools/fetchImageAsBuffer";

const URL_FORMATS = {
  namicomi: "https://uploads.namicomi.com/media/manga/",
} as const;

/**
 * Retrieves the banner image for the given title and type.
 * @param title The title object containing the necessary data.
 * @param type The type of provider (e.g., 'namicomi').
 */
export default async function getBanner(
  title: any,
  type: ProviderType
): Promise<Buffer | null> {
  const url = buildUrl(title, "namicomi");
  return fetchImageAsBuffer(url);
}

/**
 * Builds the URL for the banner image based on the title and type.
 * @param title The title object containing the necessary data.
 * @param type The type of provider (e.g., 'namicomi').
 */
const buildUrl = (title: any, type: ProviderType): URL | null => {
  const id = title?.id;
  const fileName = title?.attributes?.bannerFileName;

  if (!id || !fileName) return null;
  return new URL(`${URL_FORMATS.namicomi}${id}/banner/${fileName}`);
};
