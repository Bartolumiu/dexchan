import {
  ActionRowBuilder,
  Colors,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { ProviderType } from "../../constants/providers";
import { urlFormats } from "../parsers/urlParser";
import truncateString from "../tools/truncateString";
import { BotStrings } from "../../i18n/schema";

export default function buildTitleListEmbed(
  embed: EmbedBuilder,
  translations: BotStrings,
  titles: Map<string, string>,
  type: ProviderType,
  query: string
): ActionRowBuilder<StringSelectMenuBuilder> | null {
  if (!embed || !translations || !titles || titles.size === 0) return null;

  const sourceName = translations.sources[type];
  if (!sourceName) return null;

  const fields = Array.from(titles, ([title, id]) => {
    const url = getProviderUrl(id, type);
    const hyperlinkedText = translations.utils.title_list_embed.view.replace(
      "{source}",
      sourceName
    );

    return {
      name:
        truncateString(title, 256) ||
        translations.utils.title_list_embed.unknown,
      value: `[${hyperlinkedText}](${url})`,
    };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("search_select")
    .setPlaceholder(translations.utils.title_list_embed.placeholder)
    .setMinValues(1)
    .setMaxValues(1);

  titles.forEach((id, title) => {
    menu.addOptions({
      label:
        truncateString(title, 100) ||
        translations.utils.title_list_embed.unknown,
      value: `${type}:${id}`,
    });
  });

  embed
    .setTitle(translations.utils.title_list_embed.title)
    .setDescription(
      translations.utils.title_list_embed.description
        .replace("{query}", query)
        .replace("{source}", sourceName)
    )
    .setColor(Colors.Blurple)
    .addFields(fields);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

const getProviderUrl = (id: string, type: ProviderType): string => {
  switch (type) {
    case "mangabaka":
      return urlFormats.mangabaka.primary
        .replace("{id}", id)
        .replace("{title}", "");
    case "mangadex":
      return urlFormats.mangadex.primary
        .replace("{id}", id)
        .replace("{title}", "");
    case "namicomi":
      return urlFormats.namicomi.primary.replace("{id}", id);
    default:
      return "";
  }
};
