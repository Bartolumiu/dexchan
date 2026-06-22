import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import path from "node:path";

import getTitleCreators from "./titleCreators";
import getCover from "./titleCover";
import getBanner from "./titleBanner";
import { ProviderType } from "../../constants/providers";
import { BotStrings } from "../../i18n/schema";

export default async function setImages(
  title: any,
  embed: EmbedBuilder,
  type: ProviderType,
  translations: BotStrings,
  locale: string | null = null
): Promise<AttachmentBuilder[]> {
  switch (type) {
    case "mangabaka":
      return await setMangaBakaImages(title, embed, translations);
    case "mangadex":
      return await setMangaDexImages(title, embed, translations);
    case "namicomi":
      return await setNamiComiImages(title, embed, translations, locale);
    default:
      return [];
  }
}

const setMangaBakaImages = async (
  title: any,
  embed: EmbedBuilder,
  translations: BotStrings
): Promise<AttachmentBuilder[]> => {
  let authors = getTitleCreators(title, "mangabaka");
  if (!authors) authors = translations.utils.title_embed.author.unknown;
  if (authors.length > 256)
    authors = translations.utils.title_embed.author.too_many;

  const mbIcon = new AttachmentBuilder(
    path.join(__dirname, "../../assets/logos/mangabaka.png"),
    { name: "mangabaka.png", description: "MangaBaka logo" }
  );
  embed.setAuthor({ name: authors, iconURL: "attachment://mangabaka.png" });

  const coverBuffer = await getCover(title, "mangabaka");
  if (!coverBuffer) return [mbIcon];

  const coverImage = new AttachmentBuilder(coverBuffer, {
    name: "cover.png",
    description: "Cover image",
  });
  embed.setThumbnail("attachment://cover.jpg");

  return [mbIcon, coverImage];
};

const setMangaDexImages = async (
  title: any,
  embed: EmbedBuilder,
  translations: BotStrings
): Promise<AttachmentBuilder[]> => {
  let authors = getTitleCreators(title, "mangadex");
  if (!authors) authors = translations.utils.title_embed.author.unknown;
  if (authors.length > 256)
    authors = translations.utils.title_embed.author.too_many;

  const mdIcon = new AttachmentBuilder(
    path.join(__dirname, "../../assets/logos/mangadex.png"),
    { name: "mangadex.png", description: "MangaDex logo" }
  );
  embed.setAuthor({ name: authors, iconURL: "attachment://mangadex.png" });

  const coverBuffer = await getCover(title, "mangadex");
  if (!coverBuffer) return [mdIcon];

  const coverImage = new AttachmentBuilder(coverBuffer, {
    name: "cover.png",
    description: "Cover image",
  });
  embed.setThumbnail("attachment://cover.jpg");

  return [mdIcon, coverImage];
};

const setNamiComiImages = async (
  title: any,
  embed: EmbedBuilder,
  translations: BotStrings,
  locale: string | null
): Promise<AttachmentBuilder[]> => {
  let author = getTitleCreators(title, "namicomi");
  if (!author) author = translations.utils.title_embed.author.unknown;
  if (author.length > 256)
    author = translations.utils.title_embed.author.too_many;

  const ncIcon = new AttachmentBuilder(
    path.join(__dirname, "../../assets/logos/namicomi.png"),
    { name: "namicomi.png", description: "NamiComi logo" }
  );
  embed.setAuthor({ name: author, iconURL: "attachment://namicomi.png" });

  const coverBuffer = await getCover(title, "namicomi", locale);
  if (!coverBuffer) return [ncIcon];

  const coverImage = new AttachmentBuilder(coverBuffer, {
    name: "cover.png",
    description: "Cover image",
  });
  embed.setThumbnail("attachment://cover.jpg");

  const bannerBuffer = await getBanner(title, "namicomi");
  if (!bannerBuffer) return [ncIcon, coverImage];

  const bannerImage = new AttachmentBuilder(bannerBuffer, {
    name: "banner.png",
    description: "Banner image",
  });
  embed.setImage("attachment://banner.png");

  return [ncIcon, coverImage, bannerImage];
};
