const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const translateAttribute = require('../../functions/handlers/translateAttribute');
const path = require('path');

/**
 * An object containing regular expression components for matching various parts of a URL.
 * 
 * @property {string} protocol - Regular expression to match the protocol (http or https).
 * @property {string} primary_domain - Regular expression to match the primary domain (namicomi.com).
 * @property {string} secondary_domain - Regular expression to match the secondary domain (nami.moe).
 * @property {string} locale - Regular expression to match the locale (e.g., en-US).
 * @property {string} id - Regular expression to match an 8-character alphanumeric ID.
 * @property {string} slug - Regular expression to match the slug (path after the domain).
 */
const regexComponents = {
    protocol: 'https?:\\/\\/',
    primary_domain: 'namicomi\\.com',
    secondary_domain: 'nami\\.moe',
    locale: '[a-z]{2}(?:-[a-zA-Z]{2})?',
    id: '([a-zA-Z0-9]{8})',
    slug: '\\/[^\\/]+$',
}

/**
 * An object containing regular expression strings for different URL formats.
 * 
 * @property {string} primary - The primary URL format including protocol, primary domain, locale, title, ID, and slug.
 * @property {string} semi_shortened - A semi-shortened URL format including protocol, primary domain, and ID.
 * @property {string} shortened - A shortened URL format including protocol, secondary domain, and ID.
 */
const regexStrings = {
    primary: `${regexComponents.protocol}${regexComponents.primary_domain}\\/${regexComponents.locale}\\/title\\/${regexComponents.id}${regexComponents.slug}`,
    semi_shortened: `${regexComponents.protocol}${regexComponents.primary_domain}\\/t\\/${regexComponents.id}`,
    shortened: `${regexComponents.protocol}${regexComponents.secondary_domain}\\/t\\/${regexComponents.id}`
}

/**
 * An object containing regular expressions used for various matching patterns.
 * 
 * @property {RegExp} primary - The primary regular expression pattern.
 * @property {RegExp} semi_shortened - The semi-shortened regular expression pattern.
 * @property {RegExp} shortened - The shortened regular expression pattern.
 */
const regexes = {
    primary: new RegExp(regexStrings.primary),
    semi_shortened: new RegExp(regexStrings.semi_shortened),
    shortened: new RegExp(regexStrings.shortened)
}

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
}

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
            options: [
                { description: await translateAttribute('nami', 'options[0].description') },
                { description: await translateAttribute('nami', 'options[1].description') },
                { description: await translateAttribute('nami', 'options[2].description') }
            ]
        };
        return new SlashCommandBuilder()
            .setName('nami')
            .setDescription('Search for a title on NamiComi')
            .setDescriptionLocalizations(localizations.description)
            .addStringOption(option =>
                option.setName('query')
                    .setDescription('The title you want to search for')
                    .setDescriptionLocalizations(localizations.options[0].description)
                    .setRequired(false)
            ).addStringOption(option =>
                option.setName('id')
                    .setDescription('The ID of the title you want to search for')
                    .setDescriptionLocalizations(localizations.options[1].description)
                    .setRequired(false)
            ).addStringOption(option =>
                option.setName('url')
                    .setDescription('The URL of the title you want to search for')
                    .setDescriptionLocalizations(localizations.options[2].description)
                    .setRequired(false)
            );
    },
    async execute(interaction, client) {
        // If the interaction is not already deferred, defer it
        if (!interaction.deferred && !interaction.replied) await interaction.deferReply();

        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;
        const embed = new EmbedBuilder()
            .setFooter({
                text: await client.translate(locale, 'commands', 'nami.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username }),
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
                .setPlaceholder(await client.translate(locale, 'commands', 'nami.response.query.placeholder'))
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

            embed.setTitle(await client.translate(locale, 'commands', 'nami.response.query.title'))
                .setDescription(await client.translate(locale, 'commands', 'nami.response.query.description', { query }))
                .addFields(fields)
                .setColor(Colors.Blurple);

            return interaction.editReply({ embeds: [embed], components: [row] });
        }

        const titleID = id || await getIDfromURL(url);
        if (!(await checkIdFormat(titleID))) return sendErrorEmbed(interaction, client, locale, embed, 'nami.response.error.description.invalid_id');

        const [title, stats] = await Promise.all([getTitle(titleID), getStats(titleID)]);
        if (!title || !stats) return sendErrorEmbed(interaction, client, locale, embed, 'nami.response.error.description.invalid_id');

        await buildTitleEmbed(embed, client, locale, title, stats);
        const attachments = await setImages(title, embed, locale, client);

        const open_button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(await client.translate(locale, 'commands', 'nami.response.found.open_button'))
                .setURL(urlFormats.shortened.replace('{id}', title.id))
                .setStyle(ButtonStyle.Link)
        )

        if (interaction.type === 3) return interaction.reply({ embeds: [embed], files: attachments, components: [open_button] });
        return interaction.editReply({ embeds: [embed], files: attachments, components: [open_button] });
    }
}

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
}

/**
 * Builds an embed message for a title with localized information.
 *
 * @param {Object} embed - The embed object to be modified.
 * @param {Object} client - The client object used for translations and other utilities.
 * @param {string} locale - The locale string for translations.
 * @param {Object} title - The title object containing information about the title.
 * @param {Object} stats - The stats object containing statistical information about the title.
 * @returns {Promise<void>} A promise that resolves when the embed has been built.
 */
async function buildTitleEmbed(embed, client, locale, title, stats) {
    const embedTitle = await getLocalizedTitle(title, locale);
    const description = await getLocalizedDescription(client, title, locale) || await client.translate(locale, 'commands', 'nami.response.found.no_description');
    const author = await getCreators(title, locale, client);

    const fields = [
        { name: await client.translate(locale, 'commands', 'nami.response.found.fields[0].name'), value: `${stats.rating.bayesian.toFixed(2)}`, inline: true },
        { name: await client.translate(locale, 'commands', 'nami.response.found.fields[1].name'), value: `${stats.follows}`, inline: true },
        { name: await client.translate(locale, 'commands', 'nami.response.found.fields[2].name'), value: `${title.attributes.year}`, inline: true },
        { name: await client.translate(locale, 'commands', 'nami.response.found.fields[3].name'), value: await capitalizeFirstLetter(await client.translate(locale, 'commands', `nami.response.found.pub_status.${title.attributes.publicationStatus}`) || title.attributes.publicationStatus), inline: true },
        { name: await client.translate(locale, 'commands', 'nami.response.found.fields[4].name'), value: await capitalizeFirstLetter(title.attributes.publicationDemographic || 'N/A'), inline: true },
        { name: await client.translate(locale, 'commands', 'nami.response.found.fields[5].name'), value: await capitalizeFirstLetter(title.attributes.contentRating), inline: true }
    ];

    embed.setTitle(embedTitle)
        .setURL(urlFormats.shortened.replace('{id}', title.id))
        .setDescription(description)
        .addFields(fields)
        .setColor(Colors.Blurple);

    await addTitleTags(title, embed, locale, client);

    // Reading mode (Vertical, Horizontal: Left to Right, Horizontal: Right to Left)
    switch (title.attributes.readingMode) {
        case 'vls':
            embed.addFields({ name: await client.translate(locale, 'commands', 'nami.response.found.fields[10].name'), value: await client.translate(locale, 'commands', 'nami.response.found.fields[10].value.vertical'), inline: true });
            break;
        case 'rtl':
            embed.addFields({ name: await client.translate(locale, 'commands', 'nami.response.found.fields[10].name'), value: await client.translate(locale, 'commands', 'nami.response.found.fields[10].value.horizontal.right_to_left'), inline: true });
            break;
        case 'ltr':
            embed.addFields({ name: await client.translate(locale, 'commands', 'nami.response.found.fields[10].name'), value: await client.translate(locale, 'commands', 'nami.response.found.fields[10].value.horizontal.left_to_right'), inline: true });
            break;
    }
    embed.setAuthor({ name: author, iconURL: 'attachment://namicomi.png' });
}

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
}

/**
 * Retrieves a list of unique creators (organizations) associated with a given title.
 * If the list of creators exceeds 256 characters, a translated message indicating too many authors is returned.
 *
 * @param {Object} title - The title object containing relationships.
 * @param {string} locale - The locale for translation.
 * @param {Object} client - The client object used for translation.
 * @returns {Promise<string>} A comma-separated string of unique creators or a translated message if too many.
 */
async function getCreators(title, locale, client) {
    const creators = Array.from(new Set([
        ...title.relationships.filter(rel => rel.type === 'organization').map(rel => rel.attributes.name)
    ])).join(', ');

    return (creators.length > 256)
        ? await client.translate(locale, 'commands', 'nami.response.found.author.too_many')
        : creators;
}

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
 * @returns {Promise<Array>} A promise that resolves to an array of AttachmentBuilder objects.
 */
async function setImages(title, embed, locale, client) {
    // NamiComi logo as the author icon
    const author = await getCreators(title, locale, client);
    const namiIcon = new AttachmentBuilder(path.join(__dirname, '../../assets/logos/namicomi.png'), 'namicomi.png');
    embed.setAuthor({ name: author, iconURL: 'attachment://namicomi.png' });

    const coverURL = await getCoverURL(title, locale);
    if (!coverURL) return [namiIcon];

    // Cover image as the thumbnail
    const cover = await fetch(coverURL, { headers: { 'User-Agent': `Dex-chan/${process.version} by Bartolumiu` }, timeout: 5000 });
    if (!cover.ok) return [namiIcon];

    const coverBuffer = await cover.arrayBuffer();
    const coverImage = new AttachmentBuilder(Buffer.from(coverBuffer), { name: 'cover.png' });
    embed.setThumbnail('attachment://cover.png');

    // Title banner as the image
    const bannerURL = `https://uploads.namicomi.com/media/manga/${title.id}/banner/${title.attributes.bannerFileName}`;
    const banner = await fetch(bannerURL, { headers: { 'User-Agent': `Dex-chan/${process.version} by Bartolumiu` }, timeout: 5000 });
    if (!banner.ok) return [namiIcon, coverImage];

    const bannerBuffer = await banner.arrayBuffer();
    const bannerImage = new AttachmentBuilder(Buffer.from(bannerBuffer), { name: 'banner.png' });
    embed.setImage('attachment://banner.png');

    return [namiIcon, coverImage, bannerImage];
}

/**
 * Capitalizes the first letter of a given string.
 *
 * @param {string} string - The string to capitalize.
 * @returns {string} The string with the first letter capitalized.
 */
async function capitalizeFirstLetter(string) {
    return (typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : string);
}

/**
 * Adds title tags to the provided embed object.
 *
 * @param {Object} title - The title object containing relationships and other metadata.
 * @param {Object} embed - The embed object to which the tags will be added.
 * @param {string} locale - The locale to be used for tag names.
 * @param {Object} client - The client object used for translation.
 * @returns {Promise<void>} - A promise that resolves when the tags have been added to the embed.
 */
async function addTitleTags(title, embed, locale, client) {
    // Get the primary and secondary tag IDs
    const primaryTagID = title.relationships.find(rel => rel.type === 'primary_tag')?.id;
    const secondaryTagID = title.relationships.find(rel => rel.type === 'secondary_tag')?.id;
    const tagIDs = title.relationships.filter(rel => rel.type === 'tag').map(rel => rel.id);

    // Merge all tag IDs into a single array
    const tags = [...new Set([primaryTagID, secondaryTagID, ...tagIDs])];

    // NamiComi tag list: https://api.namicomi.com/title/tags
    // Fetch the tag list and filter out the tags that are not in the tag list
    const tagList = await fetch('https://api.namicomi.com/title/tags', { headers: { 'User-Agent': `Dex-chan/${process.version} by Bartolumiu` }, timeout: 5000 }).then(res => res.ok ? res.json() : null);
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

        tagGroups[group].push(tagData.attributes.name[locale] || tagData.attributes.name.en);
    });

    // Create the fields for the embed
    const fields = [
        {
            name: await client.translate(locale, 'commands', 'nami.response.found.fields[7].name'), // Format
            value: tagGroups.format.join(', ') || 'N/A',
            inline: true
        },
        {
            name: await client.translate(locale, 'commands', 'nami.response.found.fields[8].name'), // Genre
            value: tagGroups.genre.join(', ') || 'N/A',
            inline: true
        },
        {
            name: await client.translate(locale, 'commands', 'nami.response.found.fields[9].name'), // Theme
            value: tagGroups.theme.join(', ') || 'N/A',
            inline: true
        },
        {
            name: await client.translate(locale, 'commands', 'nami.response.found.fields[6].name'), // Content Warning
            value: tagGroups.content_warning.join(', ') || 'N/A',
            inline: true
        },
    ];
    embed.addFields(fields);
}

/**
 * Extracts an ID from a given URL based on predefined regex patterns.
 *
 * @param {string} url - The URL from which to extract the ID.
 * @returns {Promise<string|null>} - A promise that resolves to the extracted ID if a match is found, or null if no match is found.
 */
async function getIDfromURL(url) {
    const primaryMatch = regexes.primary.exec(url);
    if (primaryMatch) return primaryMatch[1];
    const semiShortenedMatch = regexes.semi_shortened.exec(url);
    if (semiShortenedMatch) return semiShortenedMatch[1];
    const shortenedMatch = regexes.shortened.exec(url);
    if (shortenedMatch) return shortenedMatch[1];
    return null;
}

/**
 * Checks if the given ID is a string of length 8.
 *
 * @param {string} id - The ID to check.
 * @returns {boolean} True if the ID is a string of length 8, otherwise false.
 */
async function checkIdFormat(id) {
    return (typeof id === 'string' && id.length === 8);

}

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
        return await fetch(`https://api.namicomi.com/cover/${rel.id}`, { headers: { 'User-Agent': `Dex-chan/${process.version} by Bartolumiu` }, timeout: 5000 }).then(res => res.ok ? res.json() : null);
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
}

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

    const response = await fetch(url, { headers: { 'User-Agent': `Dex-chan/${process.version} by Bartolumiu` }, timeout: 5000 });
    if (!response.ok) return null;
    const data = await response.json();

    return data.data;
}

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

    const [ratingsResponse, statsResponse] = await Promise.all([fetch(ratingsURL, { headers: { 'User-Agent': `Dex-chan/${process.version} by Bartolumiu` }, timeout: 5000 }), fetch(statsURL, { headers: { 'User-Agent': `Dex-chan/${process.version} by Bartolumiu` }, timeout: 5000 })]);
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
    }
}

/**
 * Retrieves a localized description for a given title.
 *
 * @param {Object} client - The client object that provides translation services.
 * @param {Object} title - The title object containing attribute descriptions.
 * @param {string} locale - The locale code to retrieve the description for.
 * @returns {Promise<string>} - A promise that resolves to the localized description.
 */
async function getLocalizedDescription(client, title, locale) {
    locale = languageMap[locale] || locale;

    let description = title.attributes.description[locale];

    if (!description && locale === 'es') description = title.attributes.description['es-419'];
    if (!description) description = title.attributes.description['en'];

    return description || await client.translate(locale, 'commands', 'nami.response.found.no_description');
}

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

    const response = await fetch(url, { headers: { 'User-Agent': `Dex-chan/${process.version} by Bartolumiu` }, timeout: 5000 });
    if (!response.ok) return null;
    const data = await response.json();

    if (data.data.length === 0) return null;
    const results = new Map(data.data.map(title => {
        if (title?.attributes?.title) {
            let localizedTitle = title.attributes.title[locale];
            if (!localizedTitle && locale === 'es') localizedTitle = title.attributes.title['es-419'];
            if (!localizedTitle) localizedTitle = title.attributes.title['en'];
            if (!localizedTitle) localizedTitle = title.attributes.title[Object.keys(title)[0]];
            return [localizedTitle, title.id];
        }
    }));

    return results;
}