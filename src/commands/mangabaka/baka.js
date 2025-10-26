const {EmbedBuilder, InteractionType, SlashCommandBuilder} = require("discord.js");
const { translateAttribute } = require("../../functions/handlers/handleLocales");
const search = require("../../functions/titles/titleSearch");
const getTitleDetails = require("../../functions/titles/titleDetails");
const { checkID, parseURL } = require("../../functions/parsers/urlParser");
const buildTitleEmbed = require('../../functions/titles/titleEmbed');
const sendErrorEmbed = require("../../functions/titles/errorEmbed");
const setImages = require("../../functions/titles/setImages");
const buildTitleListEmbed = require("../../functions/titles/titleListEmbed");

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('baka', 'description'),
            options: {
                query: await translateAttribute('baka', 'options.query.description'),
                id: await translateAttribute('baka', 'options.query.id'),
                url: await translateAttribute('baka', 'options.query.url'),
            }
        };
        return new SlashCommandBuilder()
            .setName('baka')
            .setDescription('Search for a title on MangaBaka')
            .setDescriptionLocalizations(localizations.description)
            .addStringOption(option =>
                option.setName('query')
                    .setDescription('The title you want to search for')
                    .setDescriptionLocalizations(localizations.options.query)
                    .setRequired(false)
            ).addStringOption(option =>
                option.setName('id')
                    .setDescription('The ID of the title you want to search for')
                    .setDescriptionLocalizations(localizations.options.id)
                    .setRequired(false)
            ).addStringOption(option =>
                option.setName('url')
                .setDescription('The URL of the title you want to search for')
                .setDescriptionLocalizations(localizations.options.url)
                .setRequired(false)
            );
    },
    async execute(interaction, client) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferReply();

        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.locale || interaction.locale;
        const translations = {
            embed: {
                fields: {
                    genres: await client.translate(locale, 'commands', 'baka.response.found.fields.genres.name'),
                    genres_v2: await client.translate(locale, 'commands', 'baka.response.found.fields.genres.name_v2'),
                    tags: await client.translate(locale, 'commands', 'baka.response.found.fields.tags.name'),
                    tags_v2: await client.translate(locale, 'commands', 'baka.response.found.fields.tags.name_v2'),
                    rating: await client.translate(locale, 'commands', 'baka.response.found.fields.rating.name'),
                    follows: await client.translate(locale, 'commands', 'baka.response.found.fields.follows.name'),
                    year: await client.translate(locale, 'commands', 'baka.response.found.fields.year.name'),
                    pub_status: {
                        name: await client.translate(locale, 'commands', 'baka.response.found.fields.pub_status.name'),
                        value: {
                            upcoming: await client.translate(locale, 'commands', 'baka.response.found.fields.pub_status.value.upcoming'),
                            releasing: await client.translate(locale, 'commands', 'baka.response.found.fields.pub_status.value.ongoing'),
                            completed: await client.translate(locale, 'commands', 'baka.response.found.fields.pub_status.value.completed'),
                            hiatus: await client.translate(locale, 'commands', 'baka.response.found.fields.pub_status.value.hiatus'),
                            cancelled: await client.translate(locale, 'commands', 'baka.response.found.fields.pub_status.value.cancelled'),
                            unknown: await client.translate(locale, 'commands', 'baka.response.found.fields.pub_status.value.unknown'),
                        }
                    },
                    demographic: {
                        name: await client.translate(locale, 'commands', 'baka.response.found.fields.demographic.name'),
                    },
                    content_rating: {
                        name: await client.translate(locale, 'commands', 'baka.response.found.fields.content_rating.name'),
                        value: {
                            safe: await client.translate(locale, 'commands', 'baka.response.found.fields.content_rating.value.safe'),
                            suggestive: await client.translate(locale, 'commands', 'baka.response.found.fields.content_rating.value.suggestive'),
                            erotica: await client.translate(locale, 'commands', 'baka.response.found.fields.content_rating.value.erotica'),
                            pornographic: await client.translate(locale, 'commands', 'baka.response.found.fields.content_rating.value.pornographic'),
                        }
                    }
                },
                query: {
                    title: await client.translate(locale, 'commands', 'baka.response.query.title'),
                    description: await client.translate(locale, 'commands', 'baka.response.query.description', { query: interaction.options.getString('query') }),
                    view: await client.translate(locale, 'commands', 'baka.response.query.view'),
                },
                error: {
                    title: await client.translate(locale, 'commands', 'baka.response.error.title'),
                    description: {
                        empty: await client.translate(locale, 'commands', 'baka.response.error.description.empty'),
                        no_results: await client.translate(locale, 'commands', 'baka.response.error.description.no_results'),
                        invalid_id: await client.translate(locale, 'commands', 'baka.response.error.description.invalid_id'),
                        api: await client.translate(locale, 'commands', 'baka.response.error.description.api'),
                    },
                    no_description: await client.translate(locale, 'commands', 'baka.response.found.no_description'),
                    too_many_authors: await client.translate(locale, 'commands', 'baka.response.found.author.too_many'),
                    unknown_author: await client.translate(locale, 'commands', 'baka.response.found.author.unknown')
                },
                units: {
                    votes: await client.translate(locale, 'commands', 'baka.response.stats.units.votes')
                },
                footer: await client.translate(locale, 'commands', 'baka.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username })
            },
            menu: {
                placeholder: await client.translate(locale, 'commands', 'baka.response.query.placeholder')
            },
            button: {
                open: await client.translate(locale, 'commands', 'baka.response.found.open_button'),
                stats: await client.translate(locale, 'commands', 'baka.response.found.stats_button')
            }
        };

        const embed = new EmbedBuilder()
            .setFooter({
                text: translations.embed.footer,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
            });

        const query = interaction.options.getString('query');
        const id = interaction.options.getString('id');
        const url = interaction.options.getString('url');

        if (!query && !id && !url) return sendErrorEmbed(interaction, translations, embed, 'empty');

        if (query) {
            const searchResults = await search(query, 'mangabaka');
            if (!searchResults) return sendErrorEmbed(interaction, translations, embed, 'no_results');
            const row = buildTitleListEmbed(embed, translations, searchResults, 'mangabaka');

            return interaction.editReply({ embeds: [embed], components: [row] });
        }

        const titleID = id || await parseURL(url, 'mangabaka');
        if (!(await checkID(titleID, 'mangabaka'))) return sendErrorEmbed(interaction, translations, embed, 'invalid_id');

        const entry = await getTitleDetails(titleID, 'mangabaka');
        if (!entry) return sendErrorEmbed(interaction, translations, embed, 'invalid_id');

        // Temporarily pass entry twice (no stats-specific endpoint yet)
        const buttons = buildTitleEmbed(embed, locale, entry, entry, translations, 'mangabaka');

        if (interaction.type === InteractionType.MessageComponent) {
            await interaction.reply({
                embeds: [embed],
                files: await setImages(entry, embed, 'mangabaka', translations),
                components: [buttons]
            });
        } else {
            await interaction.editReply({
                embeds: [embed],
                files: await setImages(entry, embed, 'mangabaka', translations),
                components: [buttons]
            });
        };
    }
};