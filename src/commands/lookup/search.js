const { SlashCommandBuilder, EmbedBuilder, InteractionType } = require("discord.js");
const { translateAttribute, getLocale } = require("../../functions/handlers/handleLocales");
const sendErrorEmbed = require("../../functions/titles/errorEmbed");
const search = require("../../functions/titles/titleSearch");
const buildTitleListEmbed = require("../../functions/titles/titleListEmbed");
const { parseURL, checkID } = require("../../functions/parsers/urlParser");
const getTitleDetails = require("../../functions/titles/titleDetails");
const getTitleStats = require("../../functions/titles/titleStats");
const buildTitleEmbed = require("../../functions/titles/titleEmbed");
const setImages = require("../../functions/titles/setImages");

module.exports = {
    global: true,
    data: async () => {
        const localization = {
            description: await translateAttribute('search', 'description'),
            options: {
                source: await translateAttribute('search', 'options.source.description'),
                query: await translateAttribute('search', 'options.query.description'),
                id: await translateAttribute('search', 'options.id.description'),
                url: await translateAttribute('search', 'options.url.description'),
            }
        };
        return new SlashCommandBuilder()
            .setName('search')
            .setDescription('Search for a title')
            .setDescriptionLocalizations(localization.description)
            .addStringOption(option =>
                option.setName('source')
                    .setDescription('The source to use for the search')
                    .setDescriptionLocalizations(localization.options.source)
                    .setAutocomplete(true)
                    .setRequired(true)
            ).addStringOption(option =>
                option.setName('query')
                    .setDescription('The title you want to search for')
                    .setDescriptionLocalizations(localization.options.query)
                    .setRequired(false)
            ).addStringOption(option =>
                option.setName('id')
                    .setDescription('The ID of the title you want to search for')
                    .setDescriptionLocalizations(localization.options.id)
                    .setRequired(false)
            ).addStringOption(option =>
                option.setName('url')
                    .setDescription('The URL of the title you want to search for')
                    .setDescriptionLocalizations(localization.options.url)
                    .setRequired(false)
            );
    },
    async execute(interaction, client) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferReply();

        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = getLocale(userSettings, interaction);

        // Inject source name translations to strings object
        const translations = {
            ...(await client.getTranslations(locale, 'commands', 'search')),
            sources: await client.getTranslations(locale, 'generic', 'sources')
        };

        const botSettings = await client.getMongoBotData();
        const sources = botSettings.settings.sources.filter(src => src.enabled).map(src => ({
            name: translations.options?.source?.values[src.name] ?? src.name,
            value: src.name
        }));

        const embed = new EmbedBuilder()
            .setFooter({
                text: translations.response.footer
                    .replace('{commandName}', interaction.commandName)
                    .replace('{user}', interaction.user.username),
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            });

        if (botSettings.settings.commands.find(cmd => cmd.name === 'search' && !cmd.enabled)) {
            await sendErrorEmbed(interaction, translations, embed, 'command_disabled');
            return;

        }

        const source = interaction.options.getString('source');
        if (!source) return sendErrorEmbed(interaction, translations, embed, 'no_source');
        if (!sources.find(src => src.value === source))
            return sendErrorEmbed(interaction, translations, embed, 'invalid_source', { source: source });

        const query = interaction.options.getString('query');
        const id = interaction.options.getString('id');
        const url = interaction.options.getString('url');

        if (!query && !id && !url) return sendErrorEmbed(interaction, translations, embed, 'empty');

        if (query) {
            const searchResults = await search(query, source);
            if (!searchResults) return sendErrorEmbed(interaction, translations, embed, 'no_results');
            const row = buildTitleListEmbed(embed, translations, searchResults, source, query);

            return interaction.editReply({ embeds: [embed], components: [row] });
        }

        const titleID = id || await parseURL(url, source);
        if (!(await checkID(titleID, source))) return sendErrorEmbed(interaction, translations, embed, 'invalid_id');
        const [entry, stats] = await Promise.all([getTitleDetails(titleID, source), getTitleStats(titleID, source)]);
        if (!entry || !stats) return sendErrorEmbed(interaction, translations, embed, 'invalid_id');

        const buttons = buildTitleEmbed(embed, locale, entry, stats, translations, source);
        const payload = {
            embeds: [embed],
            files: await setImages(entry, embed, source, translations),
            components: [buttons]
        };
        if (interaction.type === InteractionType.MessageComponent)
            await interaction.reply(payload);
        else
            await interaction.editReply(payload);
    },
    async autocomplete(interaction, client) {
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = getLocale(userSettings, interaction);
        const translations = await client.getTranslations(locale, 'commands', 'search');
        const sources = await getSourceList(interaction, client, translations);

        if (sources.length) return interaction.respond(
            sources.map(src => ({
                name: src.name,
                value: src.value
            })).slice(0, 25)
        );
        else return interaction.respond([]);
    }
}

/**
 * Retrieves the list of enabled sources, optionally filtering by a search term.
 * @param {*} interaction - The interaction object containing user input.
 * @param {*} client - The Discord client instance.
 * @param {*} translations - The translations object for localization.
 * @returns {Promise<[{name:string,value:string,enabled:boolean}]>} - A promise that resolves to the filtered list of sources.
 */
const getSourceList = async (interaction, client, translations) => {
    const sources = (await client.getMongoBotData()).settings.sources.map(src => {
        return {
            name: translations.options?.source?.values[src.name] ?? src.name,
            value: src.name,
            enabled: src.enabled
        }
    })

    if (interaction.options.getString('source')) {
        const input = interaction.options.getString('source').toLowerCase();
        return sources.filter(source => {
            const filtered = source.name.toLowerCase().includes(input) || source.value.toLowerCase().includes(input);
            return source.enabled && filtered;
        });
    } else return sources.filter(source => source.enabled);
}