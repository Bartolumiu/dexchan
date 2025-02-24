const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const translateAttribute = require('../../functions/handlers/translateAttribute');
const path = require('path');
const { parseURL, checkID } = require('../../functions/parsers/urlParser');
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
                    demographic: await client.translate(locale, 'commands', 'nami.response.found.fields.demographic.name'),
                    content_rating: await client.translate(locale, 'commands', 'nami.response.found.fields.content_rating.name'),
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
            const searchResults = await searchTitle(query, locale);
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

        const [title, stats] = await Promise.all([getTitle(titleID), getStats(titleID)]);
        if (!title || !stats) return sendErrorEmbed(interaction, client, locale, embed, 'nami.response.error.description.invalid_id');

        await buildTitleEmbed(embed, client, locale, title, stats, translations);
        const attachments = await setImages(title, embed, locale, client, translations);

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
    const embedTitle = await getLocalizedTitle(title, locale);
    const description = await getLocalizedDescription(title, locale, translations) || translations.embed.error.no_description;
    const author = await getCreators(title, translations);

    const fields = [
        { name: translations.embed.fields.rating, value: `${stats.rating.bayesian.toFixed(2)}`, inline: true },
        { name: translations.embed.fields.follows, value: `${stats.follows}`, inline: true },
        { name: translations.embed.fields.year, value: `${title.attributes.year}`, inline: true },
        { name: translations.embed.fields.pub_status, value: await capitalizeFirstLetter(await client.translate(locale, 'commands', `nami.response.found.pub_status.${title.attributes.publicationStatus}`) || title.attributes.publicationStatus), inline: true },
        { name: translations.embed.fields.demographic, value: await capitalizeFirstLetter(title.attributes.publicationDemographic || 'N/A'), inline: true },
        { name: translations.embed.fields.content_rating, value: await capitalizeFirstLetter(title.attributes.contentRating), inline: true }
    ];

    embed.setTitle(embedTitle)
        .setURL(urlFormats.shortened.replace('{id}', title.id))
        .setDescription(description)
        .addFields(fields)
        .setColor(Colors.Blurple);

    await addTitleTags(title, embed, locale, client, translations);

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
    embed.setAuthor({ name: author, iconURL: 'attachment://namicomi.png' });
};

/**
 * Retrieves the localized title based on the provided locale.
 * If the title is not available in the specified locale, it falls back to 'es-419' for Spanish,
 * then to English ('en'), and finally to the first available title.
 *
 * @param {Object} title - The title object containing localized titles.
 * @param {Object} title.attributes - The attributes of the title.
 * @param {Object} title.attributes.title - An object where keys are locale codes and values are titles.
 * @param {string} locale - The locale code to retrieve the title for.
 * @returns {Promise<string>} - The localized title.
 */
async function getLocalizedTitle(title, locale) {
    let localizedTitle = title.attributes.title[locale];
    if (!localizedTitle && locale === 'es') localizedTitle = title.attributes.title['es-419'];
    if (!localizedTitle) localizedTitle = title.attributes.title['en'];
    return localizedTitle || title.attributes.title[Object.keys(title.attributes.title)[0]];
};

/**
 * Retrieves a list of unique creators (organizations) associated with a given title.
 * If the list of creators exceeds 256 characters, a translated message indicating too many authors is returned.
 *
 * @param {Object} title - The title object containing relationships.
 * @param {Object} translations - The translations object containing localized strings.
 * @returns {Promise<string>} A comma-separated string of unique creators or a translated message if too many.
 */
async function getCreators(title, translations) {
    const creators = Array.from(new Set([
        ...title.relationships.filter(rel => rel.type === 'organization').map(rel => rel.attributes.name)
    ])).join(', ');

    return (creators.length > 256)
        ? translations.embed.error.too_many_authors
        : creators;
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
 * @param {Object} client - The client object used for fetching data.
 * @param {Object} translations - The translations object containing localized strings.
 * @returns {Promise<Array>} A promise that resolves to an array of AttachmentBuilder objects.
 */
async function setImages(title, embed, locale, client, translations) {
    // NamiComi logo as the author icon
    const author = await getCreators(title, translations);
    const namiIcon = new AttachmentBuilder(path.join(__dirname, '../../assets/logos/namicomi.png'), 'namicomi.png');
    embed.setAuthor({ name: author, iconURL: 'attachment://namicomi.png' });

    const coverURL = await getCoverURL(title, locale);
    if (!coverURL) return [namiIcon];

    // Cover image as the thumbnail
    try {
        const cover = await fetch(coverURL, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
        if (!cover.ok) return [namiIcon];
        
        const coverBuffer = await cover.arrayBuffer();
        const coverImage = new AttachmentBuilder(Buffer.from(coverBuffer), { name: 'cover.png' });
        embed.setThumbnail('attachment://cover.png');
        
        // Title banner as the image
        const bannerURL = `https://uploads.namicomi.com/media/manga/${title.id}/banner/${title.attributes.bannerFileName}`;
            
        try {
            const banner = await fetch(bannerURL, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
            if (!banner.ok) return [namiIcon, coverImage];
        
            const bannerBuffer = await banner.arrayBuffer();
            const bannerImage = new AttachmentBuilder(Buffer.from(bannerBuffer), { name: 'banner.png' });
            embed.setImage('attachment://banner.png');
        
            return [namiIcon, coverImage, bannerImage];
        } catch (error) {
            return [namiIcon, coverImage];
        };
    } catch (error) {
        return [namiIcon];
    };
};

/**
 * Capitalizes the first letter of a given string.
 *
 * @param {string} string - The string to capitalize.
 * @returns {string} The string with the first letter capitalized.
 */
async function capitalizeFirstLetter(string) {
    return (typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : string);
};

/**
 * Adds title tags to the provided embed object.
 *
 * @param {Object} title - The title object containing relationships and other metadata.
 * @param {Object} embed - The embed object to which the tags will be added.
 * @param {string} locale - The locale to be used for tag names.
 * @param {Object} client - The client object used for translation.
 * @returns {Promise<void>} - A promise that resolves when the tags have been added to the embed.
 */
async function addTitleTags(title, embed, locale, client, translations) {
    // Get the primary and secondary tag IDs
    const primaryTagID = title.relationships.find(rel => rel.type === 'primary_tag')?.id;
    const secondaryTagID = title.relationships.find(rel => rel.type === 'secondary_tag')?.id;
    const tagIDs = title.relationships.filter(rel => rel.type === 'tag').map(rel => rel.id);

    // Merge all tag IDs into a single array
    const tags = [...new Set([primaryTagID, secondaryTagID, ...tagIDs])];

    // NamiComi tag list: https://api.namicomi.com/title/tags
    // Fetch the tag list and filter out the tags that are not in the tag list
    try {
        const tagList = await fetch('https://api.namicomi.com/title/tags', { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 }).then(res => res.ok ? res.json() : null);
        if (!tagList) return;

        // Filter out the tag IDs that are not in the tag list
        const validTags = tags.filter(tag => tagList.data.find(t => t.id === tag));

        // Organize the tags into groups (attributes.group attribute in the tag element)
        const tagGroups = {
            theme: [],
            genre: [],
            content_warning: [],
            format: []
        };

        // Sort the tags into their respective groups
        validTags.forEach(tag => {
            const tagData = tagList.data.find(t => t.id === tag);
            if (!tagData) return;
    
            const group = tagData.attributes.group;
            if (!group) return;
    
            if (!tagGroups[group]) tagGroups[group] = [];
            tagGroups[group].push(tagData.attributes.name[locale] || tagData.attributes.name.en);
        });

        // Create the fields for the embed
        const fields = [
            {
                name: translations.embed.fields.format, // Format
                value: tagGroups.format.join(', ') || 'N/A',
                inline: true
            },
            {
                name: translations.embed.fields.genres, // Genre
                value: tagGroups.genre.join(', ') || 'N/A',
                inline: true
            },
            {
                name: translations.embed.fields.themes, // Theme
                value: tagGroups.theme.join(', ') || 'N/A',
                inline: true
            },
            {
                name: translations.embed.fields.content_warning, // Content Warning
                value: tagGroups.content_warning.join(', ') || 'N/A',
                inline: true
            },
        ];

        // Add tags from extra groups (if any)
        const otherTags = [];
        for (const [group, tags] of Object.entries(tagGroups)) {
            if (['theme', 'genre', 'content_warning', 'format'].includes(group)) continue;
            otherTags.push(...tags);
        };
        
        if (otherTags.length > 0) {
            fields.push({
                name: translations.embed.fields.other_tags, // Other Tags
                value: otherTags.join(', '),
                inline: true
            });
        };
        
        embed.addFields(fields);
    } catch (error) {
        return;
    };
};

/**
 * Fetches the cover URL for a given title and locale.
 *
 * @param {Object} title - The title object containing the ID and relationships.
 * @param {string} title.id - The ID of the title.
 * @param {Array} title.relationships - The relationships of the title.
 * @param {string} locale - The locale to match the cover art.
 * @returns {Promise<string|null>} - A promise that resolves to the cover URL or null if not found.
 */
async function getCoverURL(title, locale) {
    locale = languageMap[locale] || locale;

    const titleID = title.id;
    const coverArtRelationships = title.relationships.filter(rel => rel.type === 'cover_art');

    if (!coverArtRelationships) return null;

    // Fetch all cover arts in parallel
    const coverArtPromises = coverArtRelationships.map(async rel => {
        try {
            const res = await fetch(`https://api.namicomi.com/cover/${rel.id}`, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
            if (!res.ok) return null;
            return res.json();
        } catch (error) {
            return null;
        };
    });

    // Resolve all promises and filter out the ones that are not ok
    const coverArtDataList = (await Promise.all(coverArtPromises)).filter(data => data);

    // Find the cover art with the correct locale
    let selectedCoverArt = coverArtDataList.find(data => data?.data?.attributes?.locale === locale);

    // If no cover art matches the locale, return the first one
    if (!selectedCoverArt && coverArtDataList.length > 0) selectedCoverArt = coverArtDataList[0];
    if (!selectedCoverArt) return null;

    const fileName = selectedCoverArt.data.attributes.fileName;

    return `https://uploads.namicomi.com/covers/${titleID}/${fileName}`;
};

/**
 * Fetches the title information from the NamiComi API.
 *
 * @param {string} titleID - The ID of the title to fetch.
 * @returns {Promise<Object|null>} A promise that resolves to the title data object if the request is successful, or null if the request fails.
 */
async function getTitle(titleID) {
    const url = new URL(`https://api.namicomi.com/title/${titleID}`);
    url.searchParams.append('includes[]', 'organization');
    url.searchParams.append('includes[]', 'cover_art');
    url.searchParams.append('includes[]', 'tag');

    try {
        const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
        if (!response.ok) return null;
        const data = await response.json();

        return data.data;
    } catch (error) {
        return null;
    };
};

/**
 * Fetches and returns statistics for a given title from the NamiComi API.
 *
 * @async
 * @function getStats
 * @param {string} titleID - The ID of the title to fetch statistics for.
 * @returns {Promise<Object|null>} An object containing the title's statistics or null if the fetch fails.
 */
async function getStats(titleID) {
    const ratingsURL = new URL(`https://api.namicomi.com/title/${titleID}/rating`);
    const statsURL = new URL(`https://api.namicomi.com/statistics/title/${titleID}`);

    const [ratingsResponse, statsResponse] = await Promise.all([fetch(ratingsURL, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 }), fetch(statsURL, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 })]);
    if (!ratingsResponse.ok || !statsResponse.ok) return null;
    const [ratingsData, statsData] = await Promise.all([ratingsResponse.json(), statsResponse.json()]);

    return {
        comments: {
            /**
             * Placeholder for thread ID (data consistency).
             */
            threadId: null, // Data consistency
            repliesCount: statsData.data.attributes.commentCount,
        },
        rating: {
            average: 0, // Data consistency
            bayesian: ratingsData.data.attributes.rating,
            distribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Data consistency
        },
        follows: statsData.data.attributes.followCount,
        views: statsData.data.attributes.viewCount
    };
};

/**
 * Retrieves a localized description for a given title.
 *
 * @param {Object} title - The title object containing attribute descriptions.
 * @param {string} locale - The locale code to retrieve the description for.
 * @param {Object} translations - The translations object containing localized strings.
 * @returns {Promise<string>} - A promise that resolves to the localized description.
 */
async function getLocalizedDescription(title, locale, translations) {
    locale = languageMap[locale] || locale;

    let description = title.attributes.description[locale];

    if (!description && locale === 'es') description = title.attributes.description['es-419'];
    if (!description) description = title.attributes.description['en'];

    return description || translations.embed.error.no_description;
};

/**
 * Searches for titles based on the given query and locale.
 *
 * @async
 * @function searchTitle
 * @param {string} query - The title query to search for.
 * @param {string} locale - The locale to use for the title search.
 * @returns {Promise<Map<string, string>|null>} A promise that resolves to a Map of localized titles and their IDs, or null if no results are found.
 */
async function searchTitle(query, locale) {
    const url = new URL('https://api.namicomi.com/title/search');
    url.searchParams.append('title', query);
    url.searchParams.append('limit', 10);
    url.searchParams.append('contentRatings[]', 'safe');
    url.searchParams.append('contentRatings[]', 'mature');
    url.searchParams.append('contentRatings[]', 'restricted');

    try {
        const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
        if (!response.ok) return null;
        const data = await response.json();
        
        if (data.data.length === 0) return null;
        const results = new Map(data.data.map(title => {
            if (title?.attributes?.title) {
                let localizedTitle = title.attributes.title[locale];
                if (!localizedTitle && locale === 'es') localizedTitle = title.attributes.title['es-419'];
                if (!localizedTitle) localizedTitle = title.attributes.title['en'];
                if (!localizedTitle) localizedTitle = title.attributes.title[Object.keys(title.attributes.title)[0]];
                return [localizedTitle, title.id];
            };
        }));
    
        return results;
    } catch (error) {
        return null;
    };
};