import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
} from "discord.js";
import { MessageFlags } from "discord-api-types/v10";
import { getTranslations } from "../../functions/handlers/handleLocales";
import getTitleStats, { TitleStats } from "../../functions/titles/titleStats";
import { getInteractionContext } from "../../utils/database";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { TitleStatsI18n } from "./title_stats.i18n";
import { ProviderType } from "../../constants/providers";

export default {
  data: {
    customId: /_title_stats_/,
  },
  async execute(interaction: ButtonInteraction, client: ExtendedClient) {
    await interaction.deferUpdate();
    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);
    const strings = translations.components.title_stats;

    const customId = interaction.customId;
    const match = customId.match(/^(.+)_title_stats_(.+)$/);
    if (!match) return null;
    const source = match[1] as ProviderType;
    const entryId = match[2];

    const stats = await getTitleStats(entryId, source);

    if (!stats) {
      const embed = new EmbedBuilder()
        .setTitle(strings.error.title)
        .setDescription(strings.error.description)
        .setFooter({
          text: strings.response.footer.replace(
            "{user}",
            interaction.user.username
          ),
          iconURL: client.user?.avatarURL() ?? undefined,
        })
        .setColor(Colors.Red);
      return interaction.followUp({
        embeds: [embed],
        flags: [MessageFlags.Ephemeral],
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(strings.response.title)
      .setDescription(
        strings.response.description
          .replace("{titleId}", entryId)
          .replace("{source}", translations.sources[source] ?? source)
      )
      .addFields(buildEmbedFields(stats, strings, source))
      .setFooter({
        text: strings.response.footer.replace(
          "{user}",
          interaction.user.username
        ),
        iconURL: client.user?.avatarURL() ?? undefined,
      })
      .setColor(Colors.Blurple);

    const buttons = buildButtons(stats, strings, source);

    await interaction.followUp({
      embeds: [embed],
      components: buttons ? [buttons] : [],
    });
  },
};

const buildEmbedFields = (
  stats: TitleStats,
  strings: TitleStatsI18n,
  type: ProviderType
) => {
  switch (type) {
    case "mangadex":
      return buildMangaDexEmbedFields(stats, strings);
    case "namicomi":
      return buildNamiComiEmbedFields(stats, strings);
    default:
      return [];
  }
};

const buildMangaDexEmbedFields = (
  stats: TitleStats,
  strings: TitleStatsI18n
) => {
  return [
    {
      name: strings.response.fields.average.name,
      value: `${stats.title.rating.average}/10.00 (${stats.title.rating.count} ${strings.response.units.votes})`,
      inline: true,
    },
    {
      name: strings.response.fields.bayesian.name,
      value: `${stats.title.rating.bayesian}/10.00`,
      inline: true,
    },
    {
      name: strings.response.fields.follows.name,
      value: `${stats.title.follows}`,
      inline: true,
    },
    {
      name: strings.response.fields.distribution.name,
      value:
        Object.entries(stats.title.rating.distribution)
          .reverse()
          .filter(([, count]) => count > 0)
          .map(
            ([rating, count]) =>
              `${rating}/10: \`${count}\` · (${((count / stats.title.rating.count) * 100).toFixed(2)}%)`
          )
          .join("\n") || "N/A",
    },
    {
      name: strings.response.fields.comments.name,
      value: `${stats.title.comments.repliesCount}`,
      inline: true,
    },
  ];
};

const buildNamiComiEmbedFields = (
  stats: TitleStats,
  strings: TitleStatsI18n
) => {
  return [
    {
      name: strings.response.fields.rating.name,
      value: `${stats.title.rating.bayesian}/5.00 (${stats.title.rating.count} ${strings.response.units.votes})`,
      inline: true,
    },
    {
      name: strings.response.fields.views.name,
      value: `${stats.title.views}`,
      inline: true,
    },
    {
      name: strings.response.fields.follows.name,
      value: `${stats.title.follows}`,
      inline: true,
    },
    {
      name: strings.response.fields.comments.name,
      value: `${stats.title.comments.repliesCount}`,
      inline: true,
    },
    {
      name: strings.response.fields.chapter_views.name,
      value: `${stats.chapters.views}`,
      inline: true,
    },
    {
      name: strings.response.fields.chapter_comments.name,
      value: `${stats.chapters.comments}`,
      inline: true,
    },
    {
      name: strings.response.fields.chapter_reactions.name,
      value: `${stats.chapters.reactions}`,
      inline: true,
    },
  ];
};

const buildButtons = (
  stats: TitleStats,
  strings: TitleStatsI18n,
  type: ProviderType
): ActionRowBuilder<ButtonBuilder> | null => {
  switch (type) {
    case "mangadex":
      return buildMangaDexButtons(stats, strings);
    case "namicomi":
      return buildNamiComiButtons();
    default:
      return null;
  }
};

const buildMangaDexButtons = (
  stats: TitleStats,
  strings: TitleStatsI18n
): ActionRowBuilder<ButtonBuilder> => {
  const buttons = new ActionRowBuilder<ButtonBuilder>();
  if (stats.title.comments.threadId) {
    buttons.addComponents(
      new ButtonBuilder()
        .setLabel(strings.response.buttons.mangadex.forum.open)
        .setURL(
          `https://forums.mangadex.org/threads/${stats.title.comments.threadId}`
        )
        .setStyle(ButtonStyle.Link)
    );
  } else {
    buttons.addComponents(
      new ButtonBuilder()
        .setLabel(strings.response.buttons.mangadex.forum.no_thread)
        .setURL("https://forums.mangadex.org/")
        .setStyle(ButtonStyle.Link)
        .setDisabled(true)
    );
  }
  return buttons;
};

const buildNamiComiButtons = (): null => {
  return null;
};
