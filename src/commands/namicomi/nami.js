const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const { translateAttribute } = require('../../functions/handlers/handleLocales');
const search = require('../../functions/titles/titleSearch');
const capitalizeFirstLetter = require('../../functions/tools/capitalizeFirstLetter');
const path = require('path');
const { parseURL, checkID } = require('../../functions/parsers/urlParser');
const getTitleDetails = require('../../functions/titles/titleDetails');
const getTitleStats = require('../../functions/titles/titleStats');
const getCover = require('../../functions/titles/titleCover');
const getBanner = require('../../functions/titles/titleBanner');
const getLocalizedDescription = require('../../functions/titles/localizedDescription');
const getTitleTags = require('../../functions/titles/titleTags');
const getTitleCreators = require('../../functions/titles/titleCreators');
const getLocalizedTitle = require('../../functions/titles/localizedTitle');
let version = require('../../../package.json').version;
const USER_AGENT = `Dex-chan/${version} by Bartolumiu`;

/**
 * An object containing different URL formats for accessing titles on the Namicomi website.
 * 
 * @property {string} primary - The primary URL format, which includes locale, title ID, and slug.
 * @property {string} semi_shortened - A semi-shortened URL format that includes only the title ID.
 * @property {string} shortened - A shortened URL format that uses a different domain and includes only the title ID.
 */
const urlFormats = {
    primary: 'https://namicomi.com/{locale}/title/{id}/{slug}',
    semi_shortened: 'https://namicomi.com/t/{id}',
    shortened: 'https://nami.moe/t/{id}'
};

/**
 * A mapping of locale codes to their corresponding language codes.
 * 
 * @constant {Object.<string, string>}
 * @property {string} en-GB - Maps to 'en' for English (Great Britain).
 * @property {string} en-US - Maps to 'en' for English (United States).
 * @property {string} es-ES - Maps to 'es' for Spanish (Spain).
 * @property {string} es-419 - Maps to 'es' for Spanish (Latin America and Caribbean).
 */
const languageMap = {
    'en-GB': 'en',
    'en-US': 'en',
    'es-ES': 'es',
    'es-419': 'es'
};

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
                    pub_status: await client.translate(locale, 'commands', 'nami.response.found.fields.pub_status.name'),
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
                    description: await client.translate(locale, 'commands', 'nami.response.query.description'),
                },
                error: {
                    title: await client.translate(locale, 'commands', 'nami.response.error.title'),
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

        if (!query && !id && !url) return sendErrorEmbed(interaction, client, locale, embed, 'nami.response.error.description.empty');

        if (query) {
            const searchResults = await search(query, 'namicomi', locale);
            if (!searchResults) return sendErrorEmbed(interaction, client, locale, embed, 'nami.response.error.description.no_results');
            const fields = Array.from(searchResults, ([title, id]) => {
                if (typeof title !== 'string' || typeof id !== 'string') return null;
                if (title.length > 256) {
                    const truncatedTitle = title.slice(0, 250).split(' ').slice(0, -1).join(' ');
                    title = `${truncatedTitle} (...)`;
                }

                return { name: title, value: `[View Title](${urlFormats.shortened.replace('{id}', id)})` };
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
                .setDescription(translations.embed.query.description.replace('%query%', query))
                .addFields(fields)
                .setColor(Colors.Blurple);

            return interaction.editReply({ embeds: [embed], components: [row] });
        }

        const titleID = id || await parseURL(url, 'namicomi');
        if (!(await checkID(titleID, 'namicomi'))) return sendErrorEmbed(interaction, client, locale, embed, 'nami.response.error.description.invalid_id');

        const [title, stats] = await Promise.all([getTitleDetails(titleID, 'namicomi'), getTitleStats(titleID, 'namicomi')]);
        if (!title || !stats) return sendErrorEmbed(interaction, client, locale, embed, 'nami.response.error.description.invalid_id');

        await buildTitleEmbed(embed, client, locale, title, stats, translations);
        const attachments = await setImages(title, embed, locale);

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(translations.button.open)
                .setURL(urlFormats.shortened.replace('{id}', title.id))
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel(translations.button.stats)
                .setCustomId(`nami_stats_${title.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false)
                .setEmoji('📊')
        )

        if (interaction.type === 3) return interaction.reply({ embeds: [embed], files: attachments, components: [buttons] });
        return interaction.editReply({ embeds: [embed], files: attachments, components: [buttons] });
    }
};

/**
 * Sends an error embed message in response to an interaction.
 *
 * @param {Object} interaction - The interaction object from Discord.
 * @param {Object} client - The Discord client instance.
 * @param {string} locale - The locale string for translation.
 * @param {Object} embed - The embed object to be modified and sent.
 * @param {string} errorKey - The key for the error message to be translated.
 * @returns {Promise<Object>} - A promise that resolves to the edited interaction reply.
 */
async function sendErrorEmbed(interaction, client, locale, embed, errorKey) {
    embed.setTitle(await client.translate(locale, 'commands', 'nami.response.error.title'))
        .setDescription(await client.translate(locale, 'commands', errorKey))
        .setColor(Colors.Red);

    return interaction.editReply({ embeds: [embed] });
};

/**
 * Builds an embed message for a title with localized information.
 *
 * @param {Object} embed - The embed object to be modified.
 * @param {Object} client - The client object used for translations and other utilities.
 * @param {string} locale - The locale string for translations.
 * @param {Object} title - The title object containing information about the title.
 * @param {Object} stats - The stats object containing statistical information about the title.
 * @param {Object} translations - The translations object containing localized strings.
 * @returns {Promise<void>} A promise that resolves when the embed has been built.
 */
async function buildTitleEmbed(embed, client, locale, title, stats, translations) {
    const embedTitle = getLocalizedTitle(title, 'namicomi', locale);
    const description = getLocalizedDescription(title, 'namicomi', locale) || translations.embed.error.no_description;

    const fields = [
        { name: translations.embed.fields.rating, value: `${stats.rating.bayesian.toFixed(2)}`, inline: true },
        { name: translations.embed.fields.follows, value: `${stats.follows}`, inline: true },
        { name: translations.embed.fields.year, value: `${title.attributes.year}`, inline: true },
        { name: translations.embed.fields.pub_status, value: capitalizeFirstLetter(await client.translate(locale, 'commands', `nami.response.found.pub_status.${title.attributes.publicationStatus}`) || title.attributes.publicationStatus), inline: true },
        { name: translations.embed.fields.demographic.name, value: translations.embed.fields.demographic.value[title.attributes.demographic] || 'N/A', inline: true },
        { name: translations.embed.fields.content_rating.name, value: capitalizeFirstLetter(title.attributes.contentRating), inline: true }
    ];

    embed.setTitle(embedTitle)
        .setURL(urlFormats.shortened.replace('{id}', title.id))
        .setDescription(description)
        .addFields(fields)
        .setColor(Colors.Blurple);

    await addTitleTags(title, embed, locale, translations);

    // Reading mode (Vertical, Horizontal: Left to Right, Horizontal: Right to Left)
    switch (title.attributes.readingMode) {
        case 'vls':
            embed.addFields({ name: translations.embed.fields.reading_mode.name, value: translations.embed.fields.reading_mode.vertical, inline: true });
            break;
        case 'rtl':
            embed.addFields({ name: translations.embed.fields.reading_mode.name, value: translations.embed.fields.reading_mode.horizontal.right_to_left, inline: true });
            break;
        case 'ltr':
            embed.addFields({ name: translations.embed.fields.reading_mode.name, value: translations.embed.fields.reading_mode.horizontal.left_to_right, inline: true });
            break;
    };
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

/**
 * Adds title tags to the provided embed object.
 *
 * @param {Object} title - The title object containing relationships and other metadata.
 * @param {Object} embed - The embed object to which the tags will be added.
 * @param {string} locale - The locale to be used for tag names.
 * @param {Object} translations - The translations object containing localized strings.
 * @returns {Promise<void>} - A promise that resolves when the tags have been added to the embed.
 */
async function addTitleTags(title, embed, locale, translations) {
    const groups = getTitleTags(title, 'namicomi', locale);
    if (!groups) return;

    const fields = [
        { name: translations.embed.fields.format, value: groups.format, inline: true },
        { name: translations.embed.fields.genres, value: groups.genre, inline: true },
        { name: translations.embed.fields.themes, value: groups.theme, inline: true },
        { name: translations.embed.fields.content_warning, value: groups.content_warning, inline: true },
        { name: translations.embed.fields.other_tags, value: groups.other, inline: true }
    ]

    embed.addFields(fields);
};