const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder, InteractionType } = require('discord.js');
const { translateAttribute } = require('../../functions/handlers/handleLocales');
const search = require('../../functions/titles/titleSearch');
const path = require('path');
const { parseURL, checkID, urlFormats } = require('../../functions/parsers/urlParser');
const getTitleDetails = require('../../functions/titles/titleDetails');
const getTitleStats = require('../../functions/titles/titleStats');
const getCover = require('../../functions/titles/titleCover');
const getBanner = require('../../functions/titles/titleBanner');
const getTitleCreators = require('../../functions/titles/titleCreators');
const buildTitleEmbed = require('../../functions/titles/titleEmbed');
const sendErrorEmbed = require('../../functions/titles/errorEmbed');

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
                    other_tags: await client.translate(locale, 'commands', 'nami.response.found.fields.other_tags.name')
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

        if (!query && !id && !url) return sendErrorEmbed(interaction, translations, locale, embed, 'empty');

        if (query) {
            const searchResults = await search(query, 'namicomi', locale);
            if (!searchResults) return sendErrorEmbed(interaction, translations, locale, embed, 'no_results');
            const fields = Array.from(searchResults, ([title, id]) => {
                if (typeof title !== 'string' || typeof id !== 'string') return null;
                if (title.length > 256) {
                    const truncatedTitle = title.slice(0, 250).split(' ').slice(0, -1).join(' ');
                    title = `${truncatedTitle} (...)`;
                }

                return { name: title, value: `[View Title](${urlFormats.namicomi.shortened.replace('{id}', id)})` };
            }).filter(Boolean);

            const menu = new StringSelectMenuBuilder()
                .setCustomId('nami_select')
                .setPlaceholder(translations.menu.placeholder)
                .setMinValues(1)
                .setMaxValues(1);

            let menuOptions = [];
            searchResults.forEach((id, title) => {
                if (typeof title === 'string' && title.length > 100) {
                    const truncatedTitle = title.slice(0, 94).split(' ').slice(0, -1).join(' ');
                    title = `${truncatedTitle} (...)`;
                };
                menuOptions.push({ label: title, value: id });
            });
            menu.setOptions(menuOptions);

            const row = new ActionRowBuilder().addComponents(menu);

            embed.setTitle(translations.embed.query.title)
                .setDescription(translations.embed.query.description)
                .addFields(fields)
                .setColor(Colors.Blurple);

            return interaction.editReply({ embeds: [embed], components: [row] });
        }

        const titleID = id || await parseURL(url, 'namicomi');
        if (!(await checkID(titleID, 'namicomi'))) return sendErrorEmbed(interaction, translations, locale, embed, 'invalid_id');

        const [title, stats] = await Promise.all([getTitleDetails(titleID, 'namicomi'), getTitleStats(titleID, 'namicomi')]);
        if (!title || !stats) return sendErrorEmbed(interaction, translations, locale, embed, 'invalid_id');

        buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
        const attachments = await setImages(title, embed, locale);

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(translations.button.open)
                .setURL(urlFormats.namicomi.shortened.replace('{id}', title.id))
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel(translations.button.stats)
                .setCustomId(`nami_stats_${title.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false)
                .setEmoji('📊')
        )

        if (interaction.type === InteractionType.MessageComponent) return interaction.reply({ embeds: [embed], files: attachments, components: [buttons] });
        return interaction.editReply({ embeds: [embed], files: attachments, components: [buttons] });
    }
};

/**
 * Sets images for the embed based on the provided title.
 *
 * This function fetches and sets the author icon, cover image, and title banner
 * for the given embed. It returns an array of AttachmentBuilder objects containing
 * the images.
 *
 * @param {Object} title - The title object containing information about the manga.
 * @param {Object} embed - The embed object to set the images on.
 * @param {string} locale - The locale string for fetching localized data.
 * @returns {Promise<Array>} A promise that resolves to an array of AttachmentBuilder objects.
 */
async function setImages(title, embed, locale) {
    // NamiComi logo as the author icon
    const author = getTitleCreators(title, 'namicomi');
    const namiIcon = new AttachmentBuilder(path.join(__dirname, '../../assets/logos/namicomi.png'), 'namicomi.png');
    embed.setAuthor({ name: author, iconURL: 'attachment://namicomi.png' });

    // Cover image as the thumbnail
    const coverBuffer = await getCover(title, 'namicomi', locale);
    if (!coverBuffer) return [namiIcon];

    const coverImage = new AttachmentBuilder(Buffer.from(coverBuffer), { name: 'cover.png' });
    embed.setThumbnail('attachment://cover.png');

    // Title banner as the image
    const bannerBuffer = await getBanner(title, 'namicomi');
    if (!bannerBuffer) return [namiIcon, coverImage];

    const bannerImage = new AttachmentBuilder(Buffer.from(bannerBuffer), { name: 'banner.png' });
    embed.setImage('attachment://banner.png');

    return [namiIcon, coverImage, bannerImage];
};