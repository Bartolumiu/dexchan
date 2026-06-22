import { EmbedBuilder } from "discord.js";
import { ProviderType } from "../../constants/providers";
import { TitleTagsI18n } from "./titleTags.i18n";

export function getTitleTags(
  title: any,
  type: ProviderType,
  locale: string | null = null
): Record<string, string> | null {
  if (!title) return null;

  switch (type) {
    case "mangabaka":
      return getMangaBakaTags(title);
    case "mangadex":
      return getMangaDexTags(title);
    case "namicomi":
      return getNamiComiTags(title, locale || "en");
    default:
      return null;
  }
}

const mergeTagArrays = <T extends Record<string, string[]>>(
  groups: T
): Record<keyof T, string> => {
  const result = {} as Record<keyof T, string>;
  for (const [key, tags] of Object.entries(groups)) {
    result[key as keyof T] =
      tags.length === 0 ? "N/A" : tags.slice(0, 10).join(", ");
  }
  return result;
};

const getMangaBakaTags = (title: any) => {
  const groups = {
    tags: title.tags || [],
    genres: title.genres || [],
    tags_v2: (title.tags_v2 || []).map((tag: any) => tag.name).filter(Boolean),
    genres_v2: (title.genres_v2 || [])
      .map((genre: any) => genre.name)
      .filter(Boolean),
  };
  return mergeTagArrays(groups);
};

const getMangaDexTags = (title: any) => {
  const groups: Record<string, string[]> = {
    theme: [],
    genre: [],
    content: [],
    format: [],
  };
  const tagsArray = title.attributes?.tags || [];

  tagsArray.forEach((tag: any) => {
    const group = tag?.attributes?.group;
    const name = tag?.attributes?.name?.en;
    if (group && name && groups[group]) groups[group].push(name);
  });

  return mergeTagArrays(groups);
};

const getNamiComiTags = (title: any, locale: string) => {
  const groups: Record<string, string[]> = {
    content_warning: [],
    format: [],
    genre: [],
    theme: [],
    other: [],
  };
  const validTypes = ["tag", "primary_tag", "secondary_tag"];

  const relationships = title.relationships || [];
  const tags = relationships.filter((rel: any) =>
    validTypes.includes(rel.type)
  );

  tags.forEach((tag: any) => {
    const group = tag?.attributes?.group;
    const nameObj = tag?.attributes?.name;
    if (!group || !nameObj) return;

    const localizedName = nameObj[locale] || nameObj.en;
    if (!localizedName) return;

    if (group === "content-warnings") {
      groups.content_warning.push(localizedName);
    } else if (groups[group]) {
      groups[group].push(localizedName);
    } else {
      groups.other.push(localizedName);
    }
  });

  return mergeTagArrays(groups);
};

export function addTitleTags(
  title: any,
  embed: EmbedBuilder,
  translations: TitleTagsI18n,
  type: ProviderType,
  locale: string | null = null
): boolean | null {
  if (!title || !embed || !translations) return null;

  switch (type) {
    case "mangabaka":
      return addMangaBakaTags(title, embed, translations);
    case "mangadex":
      return addMangaDexTags(title, embed, translations);
    case "namicomi":
      return addNamiComiTags(title, embed, translations, locale || "en");
    default:
      return null;
  }
}

const addMangaBakaTags = (
  title: any,
  embed: EmbedBuilder,
  translations: TitleTagsI18n
): boolean => {
  const groups = getTitleTags(title, "mangabaka") as ReturnType<
    typeof getMangaBakaTags
  >;
  embed.addFields(
    { name: translations.genres, value: groups.genres, inline: true },
    { name: translations.tags, value: groups.tags, inline: true },
    { name: translations.genres_v2, value: groups.genres_v2, inline: true },
    { name: translations.tags_v2, value: groups.tags_v2, inline: true }
  );
  return true;
};

const addMangaDexTags = (
  title: any,
  embed: EmbedBuilder,
  translations: TitleTagsI18n
): boolean => {
  const groups = getTitleTags(title, "mangadex") as ReturnType<
    typeof getMangaDexTags
  >;
  embed.addFields(
    { name: translations.format, value: groups.format, inline: true },
    { name: translations.genres, value: groups.genre, inline: true },
    { name: translations.themes, value: groups.theme, inline: true },
    { name: translations.content_warning, value: groups.content, inline: true }
  );
  return true;
};

const addNamiComiTags = (
  title: any,
  embed: EmbedBuilder,
  translations: TitleTagsI18n,
  locale: string
): boolean => {
  const groups = getTitleTags(title, "namicomi", locale) as ReturnType<
    typeof getNamiComiTags
  >;
  embed.addFields(
    { name: translations.format, value: groups.format, inline: true },
    { name: translations.genres, value: groups.genre, inline: true },
    { name: translations.themes, value: groups.theme, inline: true },
    {
      name: translations.content_warning,
      value: groups.content_warning,
      inline: true,
    },
    { name: translations.other_tags, value: groups.other, inline: true }
  );
  return true;
};
