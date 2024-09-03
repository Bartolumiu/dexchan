const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const translateAttribute = require('../../functions/handlers/translateAttribute');
const path = require('path');

const regexComponents = {
    protocol: 'https?:\\/\\/',
    primary_domain: 'namicomi\\.com',
    secondary_domain: 'nami\\.moe',
    locale: '[a-z]{2}(?:-[A-Z]{2})?',
    id: '([a-zA-Z0-9]{8})',
    slug: '(?:\\/[^?]+)?',
}

const regexStrings = {
    primary: `${regexComponents.protocol}${regexComponents.primary_domain}\\/${regexComponents.locale}\\/title\\/${regexComponents.id}${regexComponents.slug}`,
    semi_shortened: `${regexComponents.protocol}${regexComponents.primary_domain}\\/t\\/${regexComponents.id}${regexComponents.slug}`,
    shortened: `${regexComponents.protocol}${regexComponents.secondary_domain}\\/t\\/${regexComponents.id}`
}

const regexes = {
    primary: new RegExp(regexStrings.primary),
    semi_shortened: new RegExp(regexStrings.semi_shortened),
    shortened: new RegExp(regexStrings.shortened)
}

const urlFormats = {
    primary: 'https://namicomi.com/{locale}/title/{id}/{title}',
    semi_shortened: 'https://namicomi.com/t/{id}',
    shortened: 'https://nami.moe/t/{id}'
}

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
                    const truncatedTitle = title.slice(0, 250).replace(/\s+\S*$/, '');
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
                    const truncatedTitle = title.slice(0, 94).replace(/\s+\S*$/, '');
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

async function sendErrorEmbed(interaction, client, locale, embed, errorKey) {
    embed.setTitle(await client.translate(locale, 'commands', 'nami.response.error.title'))
        .setDescription(await client.translate(locale, 'commands', errorKey))
        .setColor(Colors.Red);

    return interaction.editReply({ embeds: [embed] });
}

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
            embed.addField({ name: await client.translate(locale, 'commands', 'nami.response.found.fields[10].name'), value: await client.translate(locale, 'commands', 'nami.response.found.fields[10].value.horizontal.left_to_right'), inline: true });
            break;
    }
    embed.setAuthor({ name: author, iconURL: 'attachment://namicomi.png' });
}

async function getLocalizedTitle(title, locale) {
    const localizedTitle = title.attributes.title[locale];
    if (!localizedTitle && locale === 'es') return title.attributes.title['es-419'];
    if (!localizedTitle) return title.attributes.title['en'];
    return localizedTitle || title.attributes.title[Object.keys(title.attributes.title)[0]];
}

async function getCreators(title, locale, client) {
    const creators = Array.from(new Set([
        ...title.relationships.filter(rel => rel.type === 'organization').map(rel => rel.attributes.name)
    ])).join(', ');

    return (creators.length > 256)
        ? await client.translate(locale, 'commands', 'nami.response.found.author.too_many')
        : creators;
}

async function setImages(title, embed, locale, client) {
    // NamiComi logo as the author icon
    const author = await getCreators(title, locale, client);
    const namiIcon = new AttachmentBuilder(path.join(__dirname, '../../assets/logos/namicomi.png'), 'namicomi.png');
    embed.setAuthor({ name: author, iconURL: 'attachment://namicomi.png' });

    const coverURL = await getCoverURL(title, locale);
    if (!coverURL) return [namiIcon];

    // Cover image as the thumbnail
    const cover = await fetch(coverURL);
    if (!cover.ok) return [namiIcon];

    const coverBuffer = await cover.arrayBuffer();
    const coverImage = new AttachmentBuilder(Buffer.from(coverBuffer), { name: 'cover.png' });
    embed.setThumbnail('attachment://cover.png');

    // Title banner as the image
    const bannerURL = `https://uploads.namicomi.com/media/manga/${title.id}/banner/${title.attributes.bannerFileName}`;
    const banner = await fetch(bannerURL);
    if (!banner.ok) return [namiIcon, coverImage];

    const bannerBuffer = await banner.arrayBuffer();
    const bannerImage = new AttachmentBuilder(Buffer.from(bannerBuffer), { name: 'banner.png' });
    embed.setImage('attachment://banner.png');

    return [namiIcon, coverImage, bannerImage];
}

async function capitalizeFirstLetter(string) {
    return (typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : string);
}

async function addTitleTags(title, embed, locale, client) {
    // Get the primary and secondary tag IDs
    const primaryTagID = title.relationships.find(rel => rel.type === 'primary_tag')?.id;
    const secondaryTagID = title.relationships.find(rel => rel.type === 'secondary_tag')?.id;
    const tagIDs = title.relationships.filter(rel => rel.type === 'tag').map(rel => rel.id);

    // Merge all tag IDs into a single array
    const tags = [...new Set([primaryTagID, secondaryTagID, ...tagIDs])];

    // NamiComi tag list: https://api.namicomi.com/title/tags
    // Fetch the tag list and filter out the tags that are not in the tag list
    const tagList = await fetch('https://api.namicomi.com/title/tags').then(res => res.ok ? res.json() : null);
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

async function getIDfromURL(url) {
    url = url.split('?')[0].split('/').slice(0, 5).join('/');
    const primaryMatch = url.match(regexes.primary);
    if (primaryMatch) return primaryMatch[1];
    const semiShortenedMatch = url.match(regexes.semi_shortened);
    if (semiShortenedMatch) return semiShortenedMatch[1];
    const shortenedMatch = url.match(regexes.shortened);
    if (shortenedMatch) return shortenedMatch[1];
    return null;
}

async function checkIdFormat(id) {
    return (typeof id === 'string' && id.length === 8);

}

async function getCoverURL(title, locale) {
    locale = languageMap[locale] || locale;

    const titleID = title.id;
    const coverArtRelationships = title.relationships.filter(rel => rel.type === 'cover_art');

    if (!coverArtRelationships) return null;

    // Fetch all cover arts in parallel
    const coverArtPromises = coverArtRelationships.map(async rel => {
        return await fetch(`https://api.namicomi.com/cover/${rel.id}`).then(res => res.ok ? res.json() : null);
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

async function getTitle(titleID) {
    const url = new URL(`https://api.namicomi.com/title/${titleID}`);
    url.searchParams.append('includes[]', 'organization');
    url.searchParams.append('includes[]', 'cover_art');
    url.searchParams.append('includes[]', 'tag');

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    return data.data;
}

async function getStats(titleID) {
    const ratingsURL = new URL(`https://api.namicomi.com/title/${titleID}/rating`);
    const statsURL = new URL(`https://api.namicomi.com/statistics/title/${titleID}`);

    const [ratingsResponse, statsResponse] = await Promise.all([fetch(ratingsURL), fetch(statsURL)]);
    if (!ratingsResponse.ok || !statsResponse.ok) return null;
    const [ratingsData, statsData] = await Promise.all([ratingsResponse.json(), statsResponse.json()]);

    return {
        comments: {
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

async function getLocalizedDescription(client, title, locale) {
    locale = languageMap[locale] || locale;

    let description = title.attributes.description[locale];

    if (!description && locale === 'es') description = title.attributes.description['es-419'];
    if (!description) description = title.attributes.description['en'];

    return description || await client.translate(locale, 'commands', 'nami.response.found.no_description');
}

async function searchTitle(query, locale) {
    const url = new URL('https://api.namicomi.com/title/search');
    url.searchParams.append('title', query);
    url.searchParams.append('limit', 10);
    url.searchParams.append('contentRatings[]', 'safe');
    url.searchParams.append('contentRatings[]', 'mature');
    url.searchParams.append('contentRatings[]', 'restricted');

    const response = await fetch(url);
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