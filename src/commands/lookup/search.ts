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
import { lookupTitleById } from "../../functions/titles/titleLookup";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { getInteractionContext } from "../../utils/database";
import { SlashCommand } from "../../types/Command";
import { ProviderType } from "../../constants/providers";

type TranslationsType = ReturnType<typeof getTranslations>;

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
        translations.common.words.error,
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
      return handleQuerySearch(
        interaction,
        query,
        source as ProviderType,
        embed,
        translations,
        locale
      );
    }

    return handleIdOrUrlSearch(
      interaction,
      id,
      url,
      source as ProviderType,
      embed,
      translations,
      locale
    );
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

async function handleQuerySearch(
  interaction: ChatInputCommandInteraction,
  query: string,
  source: ProviderType,
  embed: EmbedBuilder,
  translations: TranslationsType,
  locale: string
) {
  const searchResults = await search(query, source, locale);

  if (!searchResults) {
    return sendErrorEmbed(
      interaction,
      translations.commands.search.errors,
      translations.error_embed.title,
      embed,
      "no_results"
    );
  }

  const row = buildTitleListEmbed(
    embed,
    translations,
    searchResults,
    source,
    query
  );

  await interaction.editReply({
    embeds: [embed],
    components: row ? [row] : [],
  });
}

async function handleIdOrUrlSearch(
  interaction: ChatInputCommandInteraction,
  id: string | null,
  url: string | null,
  source: ProviderType,
  embed: EmbedBuilder,
  translations: TranslationsType,
  locale: string
) {
  const searchStrings = translations.commands.search;
  const result = await lookupTitleById(id, url, source, locale, translations, embed);

  if (!result.success) {
    return sendErrorEmbed(
      interaction,
      searchStrings.errors,
      translations.error_embed.title,
      embed,
      result.errorKey,
      result.replacements
    );
  }

  await interaction.editReply(result.payload);
}
