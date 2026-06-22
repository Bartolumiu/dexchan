import { ProviderType } from "../../constants/providers";

interface Relationship {
  type: string;
  attributes?: {
    name?: string;
  };
}

interface GenericAttributesTitle {
  relationships?: Relationship[];
}

interface MangaBakaTitle {
  authors?: string[];
  artists?: string[];
}

type TitlePayload = GenericAttributesTitle & MangaBakaTitle & any;

/**
 * Extracts the creators from the title object based on the provider type.
 * @param title The title object containing the creators.
 * @param type The provider type.
 */
export default function getTitleCreators(
  title: TitlePayload,
  type: ProviderType
): string | null {
  if (!title) return null;

  switch (type) {
    case "mangabaka":
      return getMangaBakaCreators(title);
    case "mangadex":
      return getMangaDexCreators(title);
    case "namicomi":
      return getNamiComiCreators(title);
    default:
      return null;
  }
}

/**
 * Extracts the creators from the title object for MangaBaka.
 * @param title The title object containing the creators.
 */
const getMangaBakaCreators = (title: MangaBakaTitle): string | null => {
  const authors = title.authors || [];
  const artists = title.artists || [];

  const creators = Array.from(new Set([...authors, ...artists])).join(", ");
  return creators.length === 0 ? null : creators;
};

/**
 * Extracts the creators from the title object for MangaDex.
 * @param title The title object containing the creators.
 */
const getMangaDexCreators = (title: GenericAttributesTitle): string | null => {
  const relationships = title.relationships || [];

  const creatorsArray = relationships
    .filter((rel) => rel.type === "author" || rel.type === "artist")
    .map((rel) => rel.attributes?.name)
    .filter((name): name is string => Boolean(name));

  const creators = Array.from(new Set(creatorsArray)).join(", ");
  return creators.length === 0 ? null : creators;
};

/**
 * Extracts the creators from the title object for NamiComi.
 * In reality, there's only one org per title, but this should be able to handle multiple.
 * @param title The title object containing the creators.
 */
const getNamiComiCreators = (title: GenericAttributesTitle): string | null => {
  const relationships = title.relationships || [];

  const creatorsArray = relationships
    .filter((rel) => rel.type === "organization")
    .map((rel) => rel.attributes?.name)
    .filter((name): name is string => Boolean(name));

  const creators = Array.from(new Set(creatorsArray)).join(", ");
  return creators.length === 0 ? null : creators;
};
