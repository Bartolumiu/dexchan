import { ProviderType } from "../../constants/providers";
import fetchJSON from "../tools/fetchJSON";
import getLocalizedTitle from "./localizedTitle";

const URL_FORMATS = {
  mangabaka: "https://api.mangabaka.org/v1/series/search",
  mangadex: "https://api.mangadex.org/manga",
  namicomi: "https://api.namicomi.com/title",
} as const;

export default async function search(
  query: string,
  type: ProviderType,
  locale: string | null = null
): Promise<Map<string, string> | null> {
  if (!query) return null;

  const url = buildUrl(query, type);
  const response = await fetchJSON(url);

  const dataArray = response?.data;
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0)
    return null;

  return new Map(
    dataArray.map((item) => [
      getLocalizedTitle(item, type, locale ?? "en") || "Unknown Title",
      String(item.id),
    ])
  );
}

const buildUrl = (query: string, type: ProviderType): URL | null => {
  const url = new URL(URL_FORMATS[type]);

  switch (type) {
    case "mangabaka": {
      url.searchParams.append("q", query);
      url.searchParams.append("type_not", "novel");
      url.searchParams.append("limit", "10");
      ["safe", "suggestive", "erotica", "pornographic"].forEach((rating) => {
        url.searchParams.append("content_rating", rating);
      });
      return url;
    }
    case "mangadex": {
      url.searchParams.append("title", query);
      url.searchParams.append("limit", "10");
      ["safe", "suggestive", "erotica", "pornographic"].forEach((rating) => {
        url.searchParams.append("contentRating[]", rating);
      });
      return url;
    }
    case "namicomi": {
      url.searchParams.append("title", query);
      url.searchParams.append("limit", "10");
      ["safe", "mature", "restricted"].forEach((rating) => {
        url.searchParams.append("contentRating[]", rating);
      });
      return url;
    }
    default:
      return null;
  }
};
