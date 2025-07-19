const { SlashCommandBuilder, EmbedBuilder, InteractionType } = require('discord.js');
const { translateAttribute } = require('../../functions/handlers/handleLocales');
const search = require('../../functions/titles/titleSearch');
const { parseURL, checkID } = require('../../functions/parsers/urlParser');
const getTitleDetails = require('../../functions/titles/titleDetails');
const getTitleStats = require('../../functions/titles/titleStats');
const buildTitleEmbed = require('../../functions/titles/titleEmbed');
const sendErrorEmbed = require('../../functions/titles/errorEmbed');
const setImages = require('../../functions/titles/setImages');
const buildTitleListEmbed = require('../../functions/titles/titleListEmbed');

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('nami', 'description'),
            options: {
                query: await translateAttribute('nami', 'options.query.description'),
                id: await translateAttribute('nami', 'options.id.description'),
                url: await translateAttribute('nami', 'options.url.description')
            }
        };
        return new SlashCommandBuilder()
            .setName('nami')
            .setDescription('Search for a title on NamiComi')
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
        // If the interaction is not already deferred, defer it
        if (!interaction.deferred && !interaction.replied) await interaction.deferReply();

        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;
        const translations = {
            embed: {
                fields: {
                    rating: await client.translate(locale, 'commands', 'nami.response.found.fields.rating.name'),
                    follows: await client.translate(locale, 'commands', 'nami.response.found.fields.follows.name'),
                    year: await client.translate(locale, 'commands', 'nami.response.found.fields.year.name'),
                    pub_status: {
                        name: await client.translate(locale, 'commands', 'nami.response.found.fields.pub_status.name'),
                        value: {
                            ongoing: await client.translate(locale, 'commands', 'nami.response.found.fields.pub_status.value.ongoing'),
                            completed: await client.translate(locale, 'commands', 'nami.response.found.fields.pub_status.value.completed'),
                            hiatus: await client.translate(locale, 'commands', 'nami.response.found.fields.pub_status.value.hiatus'),
                            cancelled: await client.translate(locale, 'commands', 'nami.response.found.fields.pub_status.value.cancelled')
                        }
                    },
                    demographic: {
                        name: await client.translate(locale, 'commands', 'nami.response.found.fields.demographic.name'),
                        value: {
                            none: await client.translate(locale, 'commands', 'nami.response.found.fields.demographic.value.none'),
                            shounen: await client.translate(locale, 'commands', 'nami.response.found.fields.demographic.value.shounen'),
                            shoujo: await client.translate(locale, 'commands', 'nami.response.found.fields.demographic.value.shoujo'),
                            seinen: await client.translate(locale, 'commands', 'nami.response.found.fields.demographic.value.seinen'),
                            josei: await client.translate(locale, 'commands', 'nami.response.found.fields.demographic.value.josei')
                        }
                    },
                    content_rating: {
                        name: await client.translate(locale, 'commands', 'nami.response.found.fields.content_rating.name'),
                        value: {
                            safe: await client.translate(locale, 'commands', 'nami.response.found.fields.content_rating.value.safe'),
                            mature: await client.translate(locale, 'commands', 'nami.response.found.fields.content_rating.value.mature'),
                            restricted: await client.translate(locale, 'commands', 'nami.response.found.fields.content_rating.value.restricted')
                        }
                    },
                    reading_mode: {
                        name: await client.translate(locale, 'commands', 'nami.response.found.fields.reading_mode.name'),
                        vertical: await client.translate(locale, 'commands', 'nami.response.found.fields.reading_mode.value.vertical'),
                        horizontal: {
                            left_to_right: await client.translate(locale, 'commands', 'nami.response.found.fields.reading_mode.value.horizontal.left_to_right'),
                            right_to_left: await client.translate(locale, 'commands', 'nami.response.found.fields.reading_mode.value.horizontal.right_to_left')
                        }
                    },

                    format: await client.translate(locale, 'commands', 'nami.response.found.fields.format.name'),
                    genres: await client.translate(locale, 'commands', 'nami.response.found.fields.genres.name'),
                    themes: await client.translate(locale, 'commands', 'nami.response.found.fields.themes.name'),
                    content_warning: await client.translate(locale, 'commands', 'nami.response.found.fields.content_warning.name'),
                    other_tags: await client.translate(locale, 'commands', 'nami.response.found.fields.other_tags.name'),

                    type: {
                        name: await client.translate(locale, 'commands', 'nami.response.found.fields.type.name'),
                        value: {
                            manga: await client.translate(locale, 'commands', 'nami.response.found.fields.type.value.manga'),
                            manhwa: await client.translate(locale, 'commands', 'nami.response.found.fields.type.value.long_strip'),
                            manwha: await client.translate(locale, 'commands', 'nami.response.found.fields.type.value.long_strip'), // Note: 'manwha' is intentionally duplicated to match the original code until it's fixed on NamiComi's side
                            comic: await client.translate(locale, 'commands', 'nami.response.found.fields.type.value.comic'),
                            novel: await client.translate(locale, 'commands', 'nami.response.found.fields.type.value.novel')
                        }
                    }
                },
                query: {
                    title: await client.translate(locale, 'commands', 'nami.response.query.title'),
                    description: await client.translate(locale, 'commands', 'nami.response.query.description', { query: interaction.options.getString('query') }),
                },
                error: {
                    title: await client.translate(locale, 'commands', 'nami.response.error.title'),
                    description: {
                        empty: await client.translate(locale, 'commands', 'nami.response.error.description.empty'),
                        no_results: await client.translate(locale, 'commands', 'nami.response.error.description.no_results'),
                        invalid_id: await client.translate(locale, 'commands', 'nami.response.error.description.invalid_id'),
                        api: await client.translate(locale, 'commands', 'nami.response.error.description.api')
                    },
                    no_description: await client.translate(locale, 'commands', 'nami.response.found.no_description'),
                    too_many_authors: await client.translate(locale, 'commands', 'nami.response.found.author.too_many')
                },
                footer: await client.translate(locale, 'commands', 'nami.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username }),
            },
            menu: {
                placeholder: await client.translate(locale, 'commands', 'nami.response.query.placeholder')
            },
            button: {
                open: await client.translate(locale, 'commands', 'nami.response.found.open_button'),
                stats: await client.translate(locale, 'commands', 'nami.response.found.stats_button')
            }
        }

        const embed = new EmbedBuilder()
            .setFooter({
                text: translations.embed.footer,
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            });

        const query = interaction.options.getString('query');
        const id = interaction.options.getString('id');
        const url = interaction.options.getString('url');

        if (!query && !id && !url) return sendErrorEmbed(interaction, translations, embed, 'empty');

        if (query) {
            const searchResults = await search(query, 'namicomi', locale);
            if (!searchResults) return sendErrorEmbed(interaction, translations, embed, 'no_results');
            const row = buildTitleListEmbed(embed, translations, searchResults, 'namicomi');

            return interaction.editReply({ embeds: [embed], components: [row] });
        }

        const titleID = id || await parseURL(url, 'namicomi');
        if (!(await checkID(titleID, 'namicomi'))) return sendErrorEmbed(interaction, translations, embed, 'invalid_id');

        const [title, stats] = await Promise.all([getTitleDetails(titleID, 'namicomi'), getTitleStats(titleID, 'namicomi')]);
        if (!title || !stats) return sendErrorEmbed(interaction, translations, embed, 'invalid_id');

        const buttons = buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');

        if (interaction.type === InteractionType.MessageComponent) {
            interaction.reply({
                embeds: [embed],
                files: await setImages(title, embed, 'namicomi', { locale }),
                components: [buttons]
            });
        } else {
            interaction.editReply({
                embeds: [embed],
                files: await setImages(title, embed, 'namicomi', { locale }),
                components: [buttons]
            });
        };
    }
};