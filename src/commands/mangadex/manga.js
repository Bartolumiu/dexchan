const { SlashCommandBuilder, EmbedBuilder, InteractionType } = require("discord.js");
const { translateAttribute } = require('../../functions/handlers/handleLocales');
const search = require('../../functions/titles/titleSearch');
const getTitleDetails = require('../../functions/titles/titleDetails');
const getTitleStats = require('../../functions/titles/titleStats');
const { parseURL, checkID } = require('../../functions/parsers/urlParser');
const buildTitleEmbed = require('../../functions/titles/titleEmbed');
const sendErrorEmbed = require('../../functions/titles/errorEmbed');
const setImages = require('../../functions/titles/setImages');
const buildTitleListEmbed = require("../../functions/titles/titleListEmbed");

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('manga', 'description'),
            options: {
                query: await translateAttribute('manga', 'options.query.description'),
                id: await translateAttribute('manga', 'options.id.description'),
                url: await translateAttribute('manga', 'options.url.description')
            }
        };
        return new SlashCommandBuilder()
            .setName('manga')
            .setDescription('Search for a manga on MangaDex')
            .setDescriptionLocalizations(localizations.description)
            .addStringOption(option =>
                option.setName('query')
                    .setDescription('The manga you want to search for')
                    .setDescriptionLocalizations(localizations.options.query)
                    .setRequired(false)
            ).addStringOption(option =>
                option.setName('id')
                    .setDescription('The ID of the manga you want to search for')
                    .setDescriptionLocalizations(localizations.options.id)
                    .setRequired(false)
            ).addStringOption(option =>
                option.setName('url')
                    .setDescription('The URL of the manga you want to search for')
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
                    rating: await client.translate(locale, 'commands', 'manga.response.found.fields.rating.name'),
                    follows: await client.translate(locale, 'commands', 'manga.response.found.fields.follows.name'),
                    year: await client.translate(locale, 'commands', 'manga.response.found.fields.year.name'),
                    pub_status: {
                        name: await client.translate(locale, 'commands', 'manga.response.found.fields.pub_status.name'),
                        value: {
                            ongoing: await client.translate(locale, 'commands', 'manga.response.found.fields.pub_status.value.ongoing'),
                            completed: await client.translate(locale, 'commands', 'manga.response.found.fields.pub_status.value.completed'),
                            hiatus: await client.translate(locale, 'commands', 'manga.response.found.fields.pub_status.value.hiatus'),
                            cancelled: await client.translate(locale, 'commands', 'manga.response.found.fields.pub_status.value.cancelled')
                        }
                    },
                    demographic: {
                        name: await client.translate(locale, 'commands', 'manga.response.found.fields.demographic.name'),
                        value: {
                            none: await client.translate(locale, 'commands', 'manga.response.found.fields.demographic.value.none'),
                            shounen: await client.translate(locale, 'commands', 'manga.response.found.fields.demographic.value.shounen'),
                            shoujo: await client.translate(locale, 'commands', 'manga.response.found.fields.demographic.value.shoujo'),
                            seinen: await client.translate(locale, 'commands', 'manga.response.found.fields.demographic.value.seinen'),
                            josei: await client.translate(locale, 'commands', 'manga.response.found.fields.demographic.value.josei')
                        },
                    },
                    content_rating: {
                        name: await client.translate(locale, 'commands', 'manga.response.found.fields.content_rating.name'),
                        value: {
                            safe: await client.translate(locale, 'commands', 'manga.response.found.fields.content_rating.value.safe'),
                            suggestive: await client.translate(locale, 'commands', 'manga.response.found.fields.content_rating.value.suggestive'),
                            erotica: await client.translate(locale, 'commands', 'manga.response.found.fields.content_rating.value.erotica'),
                            pornographic: await client.translate(locale, 'commands', 'manga.response.found.fields.content_rating.value.pornographic')
                        }
                    },
                    format: await client.translate(locale, 'commands', 'manga.response.found.fields.format.name'),
                    genres: await client.translate(locale, 'commands', 'manga.response.found.fields.genres.name'),
                    themes: await client.translate(locale, 'commands', 'manga.response.found.fields.themes.name'),
                    content_warning: await client.translate(locale, 'commands', 'manga.response.found.fields.content_warning.name'),
                },
                query: {
                    title: await client.translate(locale, 'commands', 'manga.response.query.title'),
                    description: await client.translate(locale, 'commands', 'manga.response.query.description', { query: interaction.options.getString('query') }),
                    view: await client.translate(locale, 'commands', 'manga.response.query.view')
                },
                error: {
                    title: await client.translate(locale, 'commands', 'manga.response.error.title'),
                    description: {
                        empty: await client.translate(locale, 'commands', 'manga.response.error.description.empty'),
                        no_results: await client.translate(locale, 'commands', 'manga.response.error.description.no_results'),
                        invalid_id: await client.translate(locale, 'commands', 'manga.response.error.description.invalid_id'),
                        api: await client.translate(locale, 'commands', 'manga.response.error.description.api')
                    },
                    no_description: await client.translate(locale, 'commands', 'manga.response.found.no_description'),
                    too_many_authors: await client.translate(locale, 'commands', 'manga.response.found.author.too_many'),
                    unknown_author: await client.translate(locale, 'commands', 'manga.response.found.author.unknown')
                },
                units: {
                    votes: await client.translate(locale, 'commands', 'manga.response.stats.units.votes')
                },
                footer: await client.translate(locale, 'commands', 'manga.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username })
            },
            menu: {
                placeholder: await client.translate(locale, 'commands', 'manga.response.query.placeholder')
            },
            button: {
                open: await client.translate(locale, 'commands', 'manga.response.found.open_button'),
                stats: await client.translate(locale, 'commands', 'manga.response.found.stats_button')
            }
        };

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
            const searchResults = await search(query, 'mangadex');
            if (!searchResults) return sendErrorEmbed(interaction, translations, embed, 'no_results');
            const row = buildTitleListEmbed(embed, translations, searchResults, 'mangadex');

            return interaction.editReply({ embeds: [embed], components: [row] });
        }

        const mangaID = id || await parseURL(url, 'mangadex');
        if (!(await checkID(mangaID, 'mangadex'))) return sendErrorEmbed(interaction, translations, embed, 'invalid_id');

        const [manga, stats] = await Promise.all([getTitleDetails(mangaID, 'mangadex'), getTitleStats(mangaID, 'mangadex')]);
        if (!manga || !stats) return sendErrorEmbed(interaction, translations, embed, 'invalid_id');

        const buttons = buildTitleEmbed(embed, locale, manga, stats, translations, 'mangadex');

        if (interaction.type === InteractionType.MessageComponent) {
            await interaction.reply({
                embeds: [embed],
                files: await setImages(manga, embed, 'mangadex', { translations }),
                components: [buttons]
            });
        } else {
            await interaction.editReply({
                embeds: [embed],
                files: await setImages(manga, embed, 'mangadex', { translations }),
                components: [buttons]
            });
        };
    }
};