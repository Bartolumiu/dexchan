const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder } = require("discord.js");
const translateAttribute = require('../../functions/handlers/translateAttribute');
const capitalizeFirstLetter = require('../../functions/tools/capitalizeFirstLetter');
const search = require('../../functions/titles/titleSearch');
const getTitleDetails = require('../../functions/titles/titleDetails');
const getTitleStats = require('../../functions/titles/titleStats');
const path = require('path');
const { parseURL, checkID } = require('../../functions/parsers/urlParser');
const getCover = require("../../functions/titles/titleCover");
let version = require('../../../package.json').version;
const USER_AGENT = `Dex-chan/${version} by Bartolumiu`;

/**
 * An object containing URL formats for different MangaDex environments.
 * 
 * @property {string} primary - The URL format for the primary MangaDex environment.
 * @property {string} canary - The URL format for the canary MangaDex environment.
 * @property {string} sandbox - The URL format for the sandbox MangaDex environment.
 */
const urlFormats = {
    primary: 'https://mangadex.org/title/{id}/{title}',
    canary: 'https://canary.mangadex.dev/title/{id}/{title}',
    sandbox: 'https://sandbox.mangadex.dev/title/{id}/{title}'
};

/**
 * A mapping of locale codes to their corresponding language codes.
 * 
 * @type {Object.<string, string>}
 * @property {string} en-GB - British English mapped to 'en'.
 * @property {string} en-US - American English mapped to 'en'.
 * @property {string} es-ES - Spanish (Spain) mapped to 'es'.
 * @property {string} es-419 - Spanish (Latin America and Caribbean) mapped to 'es'.
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
                    pub_status: await client.translate(locale, 'commands', 'manga.response.found.fields.pub_status.name'),
                    demographic: await client.translate(locale, 'commands', 'manga.response.found.fields.demographic.name'),
                    content_rating: await client.translate(locale, 'commands', 'manga.response.found.fields.content_rating.name'),

                    format: await client.translate(locale, 'commands', 'manga.response.found.fields.format.name'),
                    genres: await client.translate(locale, 'commands', 'manga.response.found.fields.genres.name'),
                    themes: await client.translate(locale, 'commands', 'manga.response.found.fields.themes.name'),
                    content_warning: await client.translate(locale, 'commands', 'manga.response.found.fields.content_warning.name'),
                },
                query: {
                    title: await client.translate(locale, 'commands', 'manga.response.query.title'),
                    description: await client.translate(locale, 'commands', 'manga.response.query.description', { query: interaction.options.getString('query') })
                },
                error: {
                    title: await client.translate(locale, 'commands', 'manga.response.error.title'),
                    no_description: await client.translate(locale, 'commands', 'manga.response.found.no_description'),
                    too_many_authors: await client.translate(locale, 'commands', 'manga.response.found.author.too_many'),
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

        if (!query && !id && !url) return sendErrorEmbed(interaction, client, locale, embed, 'manga.response.error.description.empty');

        if (query) {
            const searchResults = await search(query, 'mangadex');
            if (!searchResults) return sendErrorEmbed(interaction, client, locale, embed, 'manga.response.error.description.no_results');
            const fields = Array.from(searchResults, ([title, id]) => {
                if (typeof title !== 'string' || typeof id !== 'string') return null;
                if (title.length > 256) {
                    const truncatedTitle = title.slice(0, 250).split(' ').slice(0, -1).join(' ');
                    title = `${truncatedTitle} (...)`;
                }

                return { name: title, value: `[View Manga](${urlFormats.primary.replace('{id}', id).replace('{title}', '')})` };
            }).filter(Boolean);

            const menu = new StringSelectMenuBuilder()
                .setCustomId('manga_select')
                .setPlaceholder(translations.menu.placeholder)
                .setMinValues(1)
                .setMaxValues(1);

            let menuOptions = [];
            searchResults.forEach((id, title) => {
                if (title.length > 100) {
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

        const mangaID = id || await parseURL(url, 'mangadex');
        if (!(await checkID(mangaID, 'mangadex'))) return sendErrorEmbed(interaction, client, locale, embed, 'manga.response.error.description.invalid_id');

        const [manga, stats] = await Promise.all([getTitleDetails(mangaID, 'mangadex'), getTitleStats(mangaID, 'mangadex')]);
        if (!manga || !stats) return sendErrorEmbed(interaction, client, locale, embed, 'manga.response.error.description.invalid_id');

        await buildMangaEmbed(embed, client, locale, manga, stats, translations);
        const attachments = await setImages(manga, embed, translations);

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(translations.button.open)
                .setURL(urlFormats.primary.replace('{id}', manga.id).replace('{title}', ''))
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel(translations.button.stats)
                .setCustomId(`mangadex_stats_${manga.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📊')
        );

        if (interaction.type === 3) return interaction.reply({ embeds: [embed], files: attachments, components: [buttons] });
        return interaction.editReply({ embeds: [embed], files: attachments, components: [buttons] });
    }
}

/**
 * Sends an error embed message in response to an interaction.
 *
 * @param {Object} interaction - The interaction object from Discord.
 * @param {Object} client - The client instance for interacting with Discord API.
 * @param {string} locale - The locale string for translation.
 * @param {Object} embed - The embed object to be modified and sent.
 * @param {string} errorKey - The key for the error message to be translated.
 * @returns {Promise<Object>} - A promise that resolves to the edited interaction reply.
 */
async function sendErrorEmbed(interaction, client, locale, embed, errorKey) {
    embed.setTitle(await client.translate(locale, 'commands', 'manga.response.error.title'))
        .setDescription(await client.translate(locale, 'commands', errorKey))
        .setColor(Colors.Red);

    // If it's an autocomplete interaction (selection menu), the error came from the API (probably a timeout), so API error message is sent instead
    if (interaction.type === 3) {
        embed.setDescription(await client.translate(locale, 'commands', 'manga.response.error.description.api'));
        return interaction.reply({ embeds: [embed] });
    }
    return interaction.editReply({ embeds: [embed] });
}

/**
 * Builds an embed for a manga using the provided information.
 *
 * @param {Object} embed - The embed object to be built.
 * @param {Object} client - The client object used for translations and other utilities.
 * @param {string} locale - The locale string for translations.
 * @param {Object} manga - The manga object containing manga details.
 * @param {Object} stats - The stats object containing manga statistics.
 * @param {Object} translations - The translations object containing translated strings.
 * @returns {Promise<void>} A promise that resolves when the embed is built.
 */
async function buildMangaEmbed(embed, client, locale, manga, stats, translations) {
    const title = manga.attributes.title[Object.keys(manga.attributes.title)[0]];
    const description = await getLocalizedDescription(manga, locale, translations) || translations.embed.error.no_description;
    const author = await getCreators(manga, translations);

    const fields = [
        { name: translations.embed.fields.rating, value: `${stats.rating.bayesian.toFixed(2)}`, inline: true },
        { name: translations.embed.fields.follows, value: `${stats.follows}`, inline: true },
        { name: translations.embed.fields.year, value: `${manga.attributes.year}`, inline: true },
        { name: translations.embed.fields.pub_status, value: capitalizeFirstLetter(await client.translate(locale, 'commands', `manga.response.found.pub_status.${manga.attributes.status}`) || manga.attributes.status), inline: true },
        { name: translations.embed.fields.demographic, value: capitalizeFirstLetter(manga.attributes.publicationDemographic || 'N/A'), inline: true },
        { name: translations.embed.fields.content_rating, value: capitalizeFirstLetter(manga.attributes.contentRating), inline: true }
    ];

    embed.setTitle(title)
        .setURL(urlFormats.primary.replace('{id}', manga.id).replace('{title}', ''))
        .setDescription(description)
        .addFields(fields)
        .setColor(Colors.Blurple);

    await addMangaTags(manga, embed, translations);
    embed.setAuthor({ name: author, iconURL: 'attachment://mangadex.png' });
}

/**
 * Retrieves the names of the creators (authors and artists) of a manga.
 * If the combined length of the names exceeds 256 characters, a translated message is returned.
 *
 * @param {Object} manga - The manga object containing relationships.
 * @param {Object} translations - The translations object containing translated strings.
 * @returns {Promise<string>} - A promise that resolves to a string of creator names or a translated message.
 */
async function getCreators(manga, translations) {
    const creatorsAndArtists = Array.from(new Set([
        ...manga.relationships.filter(rel => rel.type === 'author').map(rel => rel.attributes.name),
        ...manga.relationships.filter(rel => rel.type === 'artist').map(rel => rel.attributes.name)
    ])).join(', ');

    return (creatorsAndArtists.length > 256)
        ? translations.embed.error.too_many_authors
        : creatorsAndArtists;
}

/**
 * Sets the images for the given manga embed.
 *
 * @param {Object} manga - The manga object containing manga details.
 * @param {Object} embed - The embed object to set images on.
 * @param {Object} translations - The translations object containing translated strings.
 * @returns {Promise<Array>} - A promise that resolves to an array of AttachmentBuilder objects.
 */
async function setImages(manga, embed, translations) {
    const author = await getCreators(manga, translations);
    const mangadexIcon = new AttachmentBuilder(path.join(__dirname, '../../assets/logos/mangadex.png'), 'mangadex.png');
    embed.setAuthor({ name: author, iconURL: 'attachment://mangadex.png' })

    const coverBuffer = await getCover(manga, 'mangadex');
    if (!coverBuffer) return [mangadexIcon];

    const coverImage = new AttachmentBuilder(coverBuffer, { name: 'cover.png' });
    embed.setThumbnail('attachment://cover.png');

    return [mangadexIcon, coverImage];
}

/**
 * Adds manga tags to the provided embed object.
 *
 * @param {Object} manga - The manga object containing attributes and tags.
 * @param {Object} embed - The embed object to which the fields will be added.
 * @param {Object} translations - The translations object containing translated strings.
 * @returns {Promise<void>} - A promise that resolves when the fields have been added to the embed.
 */
async function addMangaTags(manga, embed, translations) {
    const tagGroups = {
        theme: [],
        genre: [],
        content: [],
        format: []
    };

    // For each tag, add it to the corresponding group
    manga.attributes.tags.forEach(tag => {
        if (!tag?.attributes?.group || !tag?.attributes?.name) return;
        tagGroups[tag.attributes.group].push(tag.attributes.name.en);
    });

    // Create the fields for the embed
    const fields = [
        {
            name: translations.embed.fields.format,
            value: tagGroups.format.join(', ') || 'N/A',
            inline: true
        },
        {
            name: translations.embed.fields.genres,
            value: tagGroups.genre.join(', ') || 'N/A',
            inline: true
        },
        {
            name: translations.embed.fields.themes,
            value: tagGroups.theme.join(', ') || 'N/A',
            inline: true
        },
        {
            name: translations.embed.fields.content_warning,
            value: tagGroups.content.join(', ') || 'N/A',
            inline: true
        },
    ];

    embed.addFields(fields);
}

/**
 * Fetches the cover URL for a given manga.
 *
 * @param {Object} manga - The manga object containing details about the manga.
 * @param {string} manga.id - The unique identifier for the manga.
 * @param {Array} manga.relationships - The relationships array containing related entities.
 * @param {Object} manga.relationships[].type - The type of relationship (e.g., 'cover_art').
 * @param {string} manga.relationships[].id - The unique identifier for the related entity.
 * @returns {Promise<string|null>} - A promise that resolves to the cover URL string or null if the fetch fails.
 */
async function getCoverURL(manga) {
    const mangaID = manga.id;
    const coverArtID = manga.relationships.find(rel => rel.type === 'cover_art').id;

    const url = new URL(`https://api.mangadex.org/cover/${coverArtID}`);

    try {
        const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
        if (!response.ok) return null;
        const data = await response.json();
        const fileName = data.data.attributes.fileName;
        return `https://mangadex.org/covers/${mangaID}/${fileName}.512.jpg`;
    } catch (error) {
        return null;
    }
}

/**
 * Retrieves the localized description of a manga.
 *
 * @param {Object} manga - The manga object containing attributes and descriptions.
 * @param {string} locale - The locale code for the desired language.
 * @param {Object} translations - The translations object containing translated strings.
 * @returns {Promise<string>} - A promise that resolves to the localized description of the manga.
 */
async function getLocalizedDescription(manga, locale, translations) {
    locale = languageMap[locale] || locale;

    let description = manga.attributes.description[locale];

    if (!description && locale === 'es') description = manga.attributes.description['es-la'];
    if (!description) description = manga.attributes.description['en'];

    return description || translations.embed.error.no_description;
}