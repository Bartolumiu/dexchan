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

const regexComponents = {
  protocol: {
    http: "https?:\\/\\/",
    https: "https?:\\/\\/",
    ftp: "ftp:\\/\\/",
    ftps: "ftps:\\/\\/",
    ws: "ws:\\/\\/",
    wss: "wss:\\/\\/",
  },
  mangabaka: {
    subdomain: "(?:dev\\.)?",
    domain: "mangabaka\\.org",
    id: "(\\d+)",
    slugAndParams: "(?:\\/[^?]+)?(?:\\?.*)?",
  },
  mangadex: {
    subdomain: "(?:www\\.)?(?:canary|sandbox\\.)?",
    domain: "mangadex\\.(?:org|dev)",
    id: "([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})",
    slugAndParams: "(?:\\/[^?]+)?(?:\\?.*)?",
  },
  namicomi: {
    primary: "namicomi\\.com",
    secondary: "nami\\.moe",
    locale: "[a-z]{2}(?:-[a-zA-Z]{2})?",
    id: "([a-zA-Z0-9]{8})",
    slug: "\\/[^\\/]+$",
  },
};

const regexStrings = {
  mangabaka: {
    id: regexComponents.mangabaka.id,
    primary: `^${regexComponents.protocol.https}${regexComponents.mangabaka.subdomain}${regexComponents.mangabaka.domain}\\/${regexComponents.mangabaka.id}${regexComponents.mangabaka.slugAndParams}$`,
  },
  mangadex: {
    id: regexComponents.mangadex.id,
    primary: `^${regexComponents.protocol.https}${regexComponents.mangadex.subdomain}${regexComponents.mangadex.domain}\\/title\\/${regexComponents.mangadex.id}${regexComponents.mangadex.slugAndParams}$`,
  },
  namicomi: {
    id: `^${regexComponents.namicomi.id}$`,
    primary: `^${regexComponents.protocol.https}${regexComponents.namicomi.primary}\\/${regexComponents.namicomi.locale}\\/title\\/${regexComponents.namicomi.id}${regexComponents.namicomi.slug}$`,
    semi_shortened: `^${regexComponents.protocol.https}${regexComponents.namicomi.primary}\\/t\\/${regexComponents.namicomi.id}$`,
    shortened: `^${regexComponents.protocol.https}${regexComponents.namicomi.secondary}\\/t\\/${regexComponents.namicomi.id}$`,
  },
};

const urlRegexes = {
  mangabaka: {
    id: new RegExp(regexComponents.mangabaka.id),
    primary: new RegExp(regexStrings.mangabaka.primary),
  },
  mangadex: {
    id: new RegExp(regexStrings.mangadex.id),
    primary: new RegExp(regexStrings.mangadex.primary),
  },
  namicomi: {
    id: new RegExp(regexStrings.namicomi.id),
    primary: new RegExp(regexStrings.namicomi.primary),
    semi_shortened: new RegExp(regexStrings.namicomi.semi_shortened),
    shortened: new RegExp(regexStrings.namicomi.shortened),
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
  const formattedUrl = url.split("?")[0].split("/").slice(0, 5).join("/");
  const match = urlRegexes.mangabaka.primary.exec(formattedUrl);
  return match ? match[1] : null;
};

const parseMangaDexURL = (url: string): string | null => {
  const formattedUrl = url.split("?")[0].split("/").slice(0, 5).join("/");
  const match = urlRegexes.mangadex.primary.exec(formattedUrl);
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
