import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import {
  format,
  getTranslations,
  translateAttribute,
} from "../../functions/handlers/handleLocales";
import { sendErrorEmbed } from "../../functions/titles/errorEmbed";
import search from "../../functions/titles/titleSearch";
import buildTitleListEmbed from "../../functions/titles/titleListEmbed";
import { checkID, parseUrl } from "../../functions/parsers/urlParser";
import getTitleDetails from "../../functions/titles/titleDetails";
import getTitleStats from "../../functions/titles/titleStats";
import buildTitleEmbed from "../../functions/titles/titleEmbed";
import setImages from "../../functions/titles/setImages";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { getInteractionContext } from "../../utils/database";
import { SlashCommand } from "../../types/Command";
import { ProviderType } from "../../constants/providers";

const command: SlashCommand = {
  global: true,
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search for a title")
    .setDescriptionLocalizations(
      translateAttribute((t) => t.commands.search.description)
    )
    .addStringOption((option) =>
      option
        .setName("source")
        .setDescription("The source to use for the search")
        .setDescriptionLocalizations(
          translateAttribute(
            (t) => t.commands.search.options.source.description
          )
        )
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The title you want to search for")
        .setDescriptionLocalizations(
          translateAttribute((t) => t.commands.search.options.query)
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("The ID of the title you want to search for")
        .setDescriptionLocalizations(
          translateAttribute((t) => t.commands.search.options.id)
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The URL of the title you want to search for")
        .setDescriptionLocalizations(
          translateAttribute((t) => t.commands.search.options.url)
        )
        .setRequired(false)
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) {
    if (!interaction.deferred && !interaction.replied)
      await interaction.deferReply();

    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);
    const searchStrings = translations.commands.search;

    const sources = context.sources.map((src) => ({
      name: translations.sources[src as ProviderType] ?? src,
      value: src,
    }));

    const embed = new EmbedBuilder().setFooter({
      text: format(translations.common.footers.command, {
        commandName: `${interaction.commandName}`,
        user: interaction.user.username,
      }),
      iconURL: client.user?.displayAvatarURL(),
    });

    const source = interaction.options.getString("source");
    if (!source)
      return sendErrorEmbed(
        interaction,
        searchStrings.errors,
        searchStrings.errors.command_disabled
          ? translations.error_embed.title
          : translations.common.words.error,
        embed,
        "no_source"
      );
    if (!sources.some((src) => src.value === source))
      return sendErrorEmbed(
        interaction,
        searchStrings.errors,
        translations.error_embed.title,
        embed,
        "invalid_source",
        { source }
      );

    const query = interaction.options.getString("query");
    const id = interaction.options.getString("id");
    const url = interaction.options.getString("url");

    if (!query && !id && !url)
      return sendErrorEmbed(
        interaction,
        searchStrings.errors,
        translations.error_embed.title,
        embed,
        "empty"
      );

    if (query) {
      const searchResults = await search(query, source as ProviderType);
      if (!searchResults)
        return sendErrorEmbed(
          interaction,
          searchStrings.errors,
          translations.error_embed.title,
          embed,
          "no_results"
        );
      const row = buildTitleListEmbed(
        embed,
        translations,
        searchResults,
        source as ProviderType,
        query
      );

      await interaction.editReply({
        embeds: [embed],
        components: row ? [row] : [],
      });
      return;
    }

    const titleID = id || parseUrl(url!, source as ProviderType);
    if (!checkID(titleID, source as ProviderType))
      return sendErrorEmbed(
        interaction,
        searchStrings.errors,
        translations.error_embed.title,
        embed,
        "invalid_id"
      );
    const [entry, stats] = await Promise.all([
      getTitleDetails(titleID!, source as ProviderType),
      getTitleStats(titleID!, source as ProviderType),
    ]);
    if (!entry || !stats)
      return sendErrorEmbed(
        interaction,
        searchStrings.errors,
        translations.error_embed.title,
        embed,
        "invalid_id"
      );

    const buttons = buildTitleEmbed(
      embed,
      locale,
      entry,
      stats,
      translations,
      source as ProviderType
    );
    const payload = {
      embeds: [embed],
      files: await setImages(
        entry,
        embed,
        source as ProviderType,
        translations
      ),
      components: buttons ? [buttons] : [],
    };
    await interaction.editReply(payload);
  },
  async autocomplete(
    interaction: AutocompleteInteraction,
    client: ExtendedClient
  ) {
    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);

    const sources = context.sources.map((src) => ({
      name: translations.sources[src as ProviderType] ?? src,
      value: src,
      enabled: true,
    }));

    const filtered = getFilteredSources(interaction, sources);

    if (filtered.length)
      return interaction.respond(
        filtered
          .map((src) => ({ name: src.name, value: src.value }))
          .slice(0, 25)
      );
    else return interaction.respond([]);
  },
};

export default command;

interface SourceEntry {
  name: string;
  value: string;
  enabled: boolean;
}

function getFilteredSources(
  interaction: AutocompleteInteraction,
  sources: SourceEntry[]
): SourceEntry[] {
  const input = interaction.options.getString("source");
  if (input) {
    const lower = input.toLowerCase();
    return sources.filter(
      (source) =>
        source.enabled &&
        (source.name.toLowerCase().includes(lower) ||
          source.value.toLowerCase().includes(lower))
    );
  }
  return sources.filter((source) => source.enabled);
}
