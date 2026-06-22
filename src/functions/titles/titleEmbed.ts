import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, } from "discord.js";
import { BotStrings } from "../../i18n/schema";
import { ProviderType } from "../../constants/providers";
import { TitleStats } from "./titleStats";
import getLocalizedTitle from "./localizedTitle";
import truncateString from "../tools/truncateString";
import { urlFormats } from "../parsers/urlParser";
import { capitalizeFirstLetter } from "../tools/capitalizeFirstLetter";
import { addTitleTags } from "./titleTags";
import { getLocalizedDescription } from "./localizedDescription";

export default function buildTitleEmbed(
  embed: EmbedBuilder,
  locale: string,
  title: any,
  stats: TitleStats,
  translations: BotStrings,
  type: ProviderType
): ActionRowBuilder<ButtonBuilder> | null {
  switch (type) {
    case "mangabaka":
      return buildMangaBakaEmbed(embed, locale, title, stats, translations);
    case "mangadex":
      return buildMangaDexEmbed(embed, locale, title, stats, translations);
    case "namicomi":
      return buildNamiComiEmbed(embed, locale, title, stats, translations);
    default:
      return null;
  }
}

const buildMangaBakaEmbed = (
  embed: EmbedBuilder,
  locale: string,
  title: any,
  stats: TitleStats,
  translations: BotStrings
): ActionRowBuilder<ButtonBuilder> => {
  const embedTitle =
    getLocalizedTitle(title, "mangabaka", locale) ||
    translations.utils.title_embed.title.unknown;
  const embedDescription = truncateString(
    sanitizeDescription(title.description) ||
      translations.utils.title_embed.description.no_description,
    4096
  );
  const f = translations.utils.title_embed.fields;

  embed
    .setTitle(embedTitle)
    .setURL(
      urlFormats.mangabaka.primary
        .replace("{id}", title.id)
        .replace("{title}", "")
    )
    .setDescription(embedDescription)
    .addFields([
      {
        name: f.rating,
        value:
          stats.title.rating.average !== "0.00"
            ? `${stats.title.rating.average}/100.00`
            : "N/A",
        inline: true,
      },
      { name: f.follows, value: "N/A", inline: true },
      { name: f.year, value: `${title.year || "N/A"}`, inline: true },
      {
        name: f.pub_status.name,
        value: capitalizeFirstLetter(
          f.pub_status.value[title.status] || title.status || "N/A"
        ),
        inline: true,
      },
      { name: f.demographic.name, value: "N/A", inline: true },
      {
        name: f.content_rating.name,
        value: capitalizeFirstLetter(
          f.content_rating.value[title.content_rating] ||
            title.content_rating ||
            "N/A"
        ),
        inline: true,
      },
    ])
    .setColor(Colors.Blurple);

  addTitleTags(
    title,
    embed,
    translations.utils.title_tags,
    "mangabaka",
    locale
  );

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(
        translations.utils.title_embed.button.open.replace(
          "{source}",
          translations.sources.mangabaka
        )
      )
      .setURL(
        urlFormats.mangabaka.primary
          .replace("{id}", title.id)
          .replace("{title}", "")
      )
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel(translations.utils.title_embed.button.stats)
      .setCustomId(`mangabaka_title_stats_${title.id}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📊")
      .setDisabled(true)
  );
};

const buildMangaDexEmbed = (
  embed: EmbedBuilder,
  locale: string,
  title: any,
  stats: TitleStats,
  translations: BotStrings
): ActionRowBuilder<ButtonBuilder> => {
  const embedTitle =
    getLocalizedTitle(title, "mangadex", locale) || translations.utils.title_embed.title.unknown;
  const embedDescription = truncateString(
    sanitizeDescription(getLocalizedDescription(title, "mangadex", locale)) ||
      translations.utils.title_embed.description.no_description,
    4096
  );
  const f = translations.utils.title_embed.fields;

  embed
    .setTitle(embedTitle)
    .setURL(
      urlFormats.mangadex.primary
        .replace("{id}", title.id)
        .replace("{title}", "")
    )
    .setDescription(embedDescription)
    .addFields([
      {
        name: f.rating,
        value: `${stats.title.rating.bayesian}/10.00`,
        inline: true,
      },
      { name: f.follows, value: `${stats.title.follows}`, inline: true },
      {
        name: f.year,
        value: `${title.attributes?.year || "N/A"}`,
        inline: true,
      },
      {
        name: f.pub_status.name,
        value: capitalizeFirstLetter(
          f.pub_status.value[title.attributes?.status] ||
            title.attributes?.status ||
            "N/A"
        ),
        inline: true,
      },
      {
        name: f.demographic.name,
        value: title.attributes?.publicationDemographic
          ? capitalizeFirstLetter(
              f.demographic.value[title.attributes.publicationDemographic] ||
                title.attributes.publicationDemographic
            )
          : "N/A",
        inline: true,
      },
      {
        name: f.content_rating.name,
        value: capitalizeFirstLetter(
          f.content_rating.value[title.attributes?.contentRating] ||
            title.attributes?.contentRating ||
            "N/A"
        ),
        inline: true,
      },
    ])
    .setColor(Colors.Blurple);

  addTitleTags(title, embed, translations.utils.title_tags, "mangadex", null);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(
        translations.utils.title_embed.button.open.replace(
          "{source}",
          translations.sources.mangadex
        )
      )
      .setURL(
        urlFormats.mangadex.primary
          .replace("{id}", title.id)
          .replace("{title}", "")
      )
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel(translations.utils.title_embed.button.stats)
      .setCustomId(`mangadex_title_stats_${title.id}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📊")
  );
};

const buildNamiComiEmbed = (
  embed: EmbedBuilder,
  locale: string,
  title: any,
  stats: TitleStats,
  translations: BotStrings
): ActionRowBuilder<ButtonBuilder> => {
  const embedTitle =
    getLocalizedTitle(title, "namicomi", locale) || translations.utils.title_embed.title.unknown;
  const embedDescription = truncateString(
    sanitizeDescription(getLocalizedDescription(title, "namicomi", locale)) ||
      translations.utils.title_embed.description.no_description,
    4096
  );
  const f = translations.utils.title_embed.fields;

  embed
    .setTitle(embedTitle)
    .setURL(urlFormats.namicomi.shortened.replace("{id}", title.id))
    .setDescription(embedDescription)
    .addFields([
      {
        name: f.rating,
        value: `${stats.title.rating.bayesian}/5.00`,
        inline: true,
      },
      { name: f.follows, value: `${stats.title.follows}`, inline: true },
      {
        name: f.year,
        value: `${title.attributes?.year || "N/A"}`,
        inline: true,
      },
      {
        name: f.pub_status.name,
        value: capitalizeFirstLetter(
          f.pub_status.value[title.attributes?.publicationStatus] ||
            title.attributes?.publicationStatus ||
            "N/A"
        ),
        inline: true,
      },
      {
        name: f.demographic.name,
        value: title.attributes?.demographic
          ? capitalizeFirstLetter(
              f.demographic.value[title.attributes.demographic] ||
                title.attributes.demographic
            )
          : "N/A",
        inline: true,
      },
      {
        name: f.content_rating.name,
        value: capitalizeFirstLetter(
          f.content_rating.value[title.attributes?.contentRating] ||
            title.attributes?.contentRating ||
            "N/A"
        ),
        inline: true,
      },
      {
        name: f.type.name,
        value: capitalizeFirstLetter(
          f.type.value[title.attributes?.type] ||
            title.attributes?.type ||
            "N/A"
        ),
        inline: true,
      },
    ])
    .setColor(Colors.Blurple);

  addTitleTags(title, embed, translations.utils.title_tags, "namicomi", locale);

  const readingMode = title.attributes?.readingMode;
  if (readingMode === "vls") {
    embed.addFields({
      name: f.reading_mode.name,
      value: f.reading_mode.value.vertical,
    });
  } else if (readingMode === "rtl") {
    embed.addFields({
      name: f.reading_mode.name,
      value: f.reading_mode.value.horizontal.right_to_left,
    });
  } else if (readingMode === "ltr") {
    embed.addFields({
      name: f.reading_mode.name,
      value: f.reading_mode.value.horizontal.left_to_right,
    });
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(
        translations.utils.title_embed.button.open.replace(
          "{source}",
          translations.sources.namicomi
        )
      )
      .setURL(urlFormats.namicomi.shortened.replace("{id}", title.id))
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel(translations.utils.title_embed.button.stats)
      .setCustomId(`namicomi_title_stats_${title.id}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📊")
  );
};

const sanitizeDescription = (
  description: string | null | undefined
): string | null => {
  if (!description || typeof description !== "string") {
    return null;
  }

  let sanitized = description
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("/&apos;", "'")
    .replaceAll("&nbsp;", " ");

  sanitized = sanitized.replaceAll("&", "&amp;");
  sanitized = sanitized.replaceAll(/<br\s*\/?>/gi, "|||LINEBREAK|||");
  sanitized = sanitized.replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  sanitized = sanitized.replaceAll("|||LINEBREAK|||", "\n");
  sanitized = sanitized.replaceAll(/\n+/g, "\n");
  sanitized = sanitized.replaceAll(/[ \t]+/g, " ");

  return sanitized.trim();
};
