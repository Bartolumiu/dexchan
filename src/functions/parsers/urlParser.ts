import { ProviderType } from "../../constants/providers";

export const urlFormats = {
  namicomi: {
    primary: "https://namicomi.com/{locale}/title/{id}/{slug}",
    semi_shortened: "https://namicomi.com/t/{id}",
    shortened: "https://nami.moe/t/{id}",
  },
  mangadex: {
    primary: "https://mangadex.org/title/{id}/{slug}",
    canary: "https://canary.mangadex.dev/title/{id}/{slug}",
    forums: "https://forums.mangadex.org/threads/{thread_id}",
  },
  mangabaka: {
    primary: "https://mangabaka.org/{id}",
  },
} as const;

const urlRegexes = {
  mangabaka: {
    id: /^(\d+)$/,
    primary:
      /^https?:\/\/(?:mangabaka\.org|dev\.mangabaka\.dev)\/(\d+)(?:\/[^?]+)?(?:\?.*)?$/,
  },
  mangadex: {
    id: /^([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})$/,
    primary:
      /^https?:\/\/(?:mangadex\.org|(?:canary|sandbox)\.mangadex\.dev)\/title\/([a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12})(?:\/.*)?$/,
  },
  namicomi: {
    id: /^([a-zA-Z0-9]{8})$/,
    primary:
      /^https?:\/\/namicomi\.com\/[a-z]{2}(?:-[a-zA-Z]{2})?\/title\/([a-zA-Z0-9]{8})\/[^/]+$/,
    semi_shortened: /^https?:\/\/namicomi\.com\/t\/([a-zA-Z0-9]{8})$/,
    shortened: /^https?:\/\/nami\.moe\/t\/([a-zA-Z0-9]{8})$/,
  },
};

/**
 * Parses a given URL to extract the ID
 * @param url The URL to be parsed
 * @param type The provider
 */
export const parseUrl = (
  url: string | null | undefined,
  type: ProviderType
): string | null => {
  if (!url || typeof url !== "string") return null;

  switch (type) {
    case "mangabaka":
      return parseMangaBakaURL(url);
    case "mangadex":
      return parseMangaDexURL(url);
    case "namicomi":
      return parseNamiComiURL(url);
    default:
      return null;
  }
};

const parseMangaBakaURL = (url: string): string | null => {
  const match = urlRegexes.mangabaka.primary.exec(url.split("?")[0]);
  return match ? match[1] : null;
};

const parseMangaDexURL = (url: string): string | null => {
  const match = urlRegexes.mangadex.primary.exec(url.split("?")[0]);
  return match ? match[1] : null;
};

const parseNamiComiURL = (url: string): string | null => {
  const primary = urlRegexes.namicomi.primary.exec(url);
  if (primary) return primary[1];

  const semiShortened = urlRegexes.namicomi.semi_shortened.exec(url);
  if (semiShortened) return semiShortened[1];

  const shortened = urlRegexes.namicomi.shortened.exec(url);
  return shortened ? shortened[1] : null;
};

/**
 * Checks the validity of a given ID based on the specified provider type.
 * @param id The ID to be checked
 * @param type The provider
 */
export const checkID = (
  id: string | null | undefined,
  type: ProviderType
): boolean | null => {
  if (!id || typeof id !== "string") return null;

  switch (type) {
    case "mangabaka":
      return urlRegexes.mangabaka.id.test(id);
    case "mangadex":
      return urlRegexes.mangadex.id.test(id);
    case "namicomi":
      return urlRegexes.namicomi.id.test(id);
    default:
      return null;
  }
};
