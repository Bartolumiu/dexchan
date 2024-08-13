const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder } = require("discord.js");
const path = require('path');

const urlRegex = /^https?:\/\/(?:www\.)?(?:(?:canary|sandbox)\.)?mangadex\.(?:org|dev)\/title\/([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})(?:\/[a-zA-Z0-9-]+)?\/?$/;
const idRegex = /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/;

const urlFormats = {
    primary: 'https://mangadex.org/title/{id}/{title}',
    canary: 'https://canary.mangadex.dev/title/{id}/{title}',
    sandbox: 'https://sandbox.mangadex.dev/title/{id}/{title}'
}

const languageMap = {
    'en-GB': 'en',
    'en-US': 'en',
    'es-ES': 'es',
    'es-419': 'es'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manga')
        .setDescription('Search for a manga on MangaDex')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The manga you want to search for')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The ID of the manga')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The URL of the manga')
                .setRequired(false)
        ),
    global: true,
    async execute(interaction, client) {
        // Get user's locale
        const locale = interaction.locale;
        const embed = new EmbedBuilder();
        embed.setFooter({ text: `/${await client.translate(locale, 'commands', 'manga.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username }) || await client.translate('en', 'commands', 'manga.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username })}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

        // Check if the user provided a query, ID or URL
        if (!interaction.options.getString('query') && !interaction.options.getString('id') && !interaction.options.getString('url')) {
            embed.setTitle(await client.translate(locale, 'commands', 'manga.response.error.title') || await client.translate('en', 'commands', 'manga.response.error.title'));
            embed.setDescription(await client.translate(locale, 'commands', 'manga.response.error.description.empty') || await client.translate('en', 'commands', 'manga.response.error.description.empty'));
            embed.setColor(Colors.Red);
        }

        // If the user provided a query, search for it
        if (interaction.options.getString('query')) {
            const searchResults = await searchManga(interaction.options.getString('query'));

            // If no results were found, send an error message
            if (!searchResults.size) {
                embed.setTitle(await client.translate(locale, 'commands', 'manga.response.error.title') || await client.translate('en', 'commands', 'manga.response.error.title'));
                embed.setDescription(await client.translate(locale, 'commands', 'manga.response.error.description.no_results') || await client.translate('en', 'commands', 'manga.response.error.description.no_results'));
                embed.setColor(Colors.Red);
                return interaction.reply({ embeds: [embed] });
            }

            // For each result, add a field with the title and a link to the manga
            // Example: { name: 'Official "Test" Manga', value: '[View Manga](https://mangadex.org/title/f9c33607-9180-4ba6-b85c-e4b5faee7192)' }
            const fields = Array.from(searchResults, ([title, id]) => ({
                name: title,
                value: `[View Manga](${urlFormats.primary.replace('{id}', id).replace('{title}', '')})`
            }));

            embed.setTitle(await client.translate(locale, 'commands', 'manga.response.query.title') || await client.translate('en', 'commands', 'manga.response.title'));
            embed.setDescription(await client.translate(locale, 'commands', 'manga.response.query.description', { query: interaction.options.getString('query') }) || await client.translate('en', 'commands', 'manga.response.query.description', { query: interaction.options.getString('query') }));
            embed.addFields(fields);
            embed.setColor(Colors.Blurple);
            return interaction.reply({ embeds: [embed] });
        }

        // If the user provided a URL, get the manga ID from it
        let mangaID = interaction.options.getString('id') || await getIDfromURL(interaction.options.getString('url'));

        // If the manga ID is invalid, send an error message
        if (!(await checkIdFormat(mangaID))) {
            embed.setTitle(await client.translate(locale, 'commands', 'manga.response.error.title') || await client.translate('en', 'commands', 'manga.response.error.title'));
            embed.setDescription(await client.translate(locale, 'commands', 'manga.response.error.description.url') || await client.translate('en', 'commands', 'manga.response.error.description.url'));
            embed.setColor(Colors.Red);
            return interaction.reply({ embeds: [embed] });
        }

        // Fetch the manga data
        const manga = await getManga(mangaID);
        const stats = await getStats(mangaID);

        const rating = client.translate(locale, 'commands', 'manga.response.found.fields[0].name') || client.translate('en', 'commands', 'manga.response.found.fields[0].name');
        const followers = client.translate(locale, 'commands', 'manga.response.found.fields[1].name') || client.translate('en', 'commands', 'manga.response.found.fields[1].name');
        const year = client.translate(locale, 'commands', 'manga.response.found.fields[2].name') || client.translate('en', 'commands', 'manga.response.found.fields[2].name');
        const status = client.translate(locale, 'commands', 'manga.response.found.fields[3].name') || client.translate('en', 'commands', 'manga.response.found.fields[3].name');
        const status_value = client.translate(locale, 'commands', `manga.response.found.pub_status.${manga.attributes.status}`) || client.translate('en', 'commands', `manga.response.found.pub_status.${manga.attributes.status}`) || manga.attributes.status;
        const demographic = client.translate(locale, 'commands', 'manga.response.found.fields[4].name') || client.translate('en', 'commands', 'manga.response.found.fields[4].name');
        const contentrating = client.translate(locale, 'commands', 'manga.response.found.fields[5].name') || client.translate('en', 'commands', 'manga.response.found.fields[5].name');

        const creatorsAndArtists = Array.from(new Set([...manga.relationships.filter(rel => rel.type === 'author').map(rel => rel.attributes.name), ...manga.relationships.filter(rel => rel.type === 'artist').map(rel => rel.attributes.name)])).join(', ');

        const author = (creatorsAndArtists.length > 256) ? await client.translate(locale, 'commands', 'manga.response.found.author.too_many') || await client.translate('en', 'commands', 'manga.response.found.too_many_creators') : creatorsAndArtists;

        embed.setTitle(manga.attributes.title.en)
            .setURL(urlFormats.primary.replace('{id}', manga.id).replace('{title}', ''))
            .setDescription(await getLocalizedDescription(manga, locale) || client.translate(locale, 'commands', 'manga.response.found.no_description') || client.translate('en', 'commands', 'manga.response.found.no_description'))
            .addFields(
                { name: rating, value: `${stats.rating.bayesian.toFixed(2)}`, inline: true },
                { name: followers, value: `${stats.follows}`, inline: true },
                { name: year, value: `${manga.attributes.year}`, inline: true },
                { name: status, value: `${await capitalizeFirstLetter(status_value)}`, inline: true },
                { name: demographic, value: `${manga.attributes.publicationDemographic === null ? 'N/A' : await capitalizeFirstLetter(manga.attributes.publicationDemographic)}` || 'N/A', inline: true },
                { name: contentrating, value: `${await capitalizeFirstLetter(manga.attributes.contentRating)}`, inline: true }
            )
            .setColor(Colors.Blurple);

        await addMangaTags(manga, embed, locale, client);
        const attachments = await setImages(manga, embed, author);

        interaction.reply({ embeds: [embed], files: attachments });
    }
}

async function setImages(manga, embed, author) {
    const mangadexIcon = new AttachmentBuilder(path.join(__dirname, '../../media/mangadex.png'), 'mangadex.png');
    embed.setAuthor({ name: author, iconURL: 'attachment://mangadex.png' })
    const coverURL = await getCoverURL(manga);
    if (!coverURL) return;

    const cover = await fetch(coverURL);
    if (!cover.ok) return;

    const coverBuffer = await cover.arrayBuffer();
    const coverBufferData = Buffer.from(coverBuffer);
    const coverImage = new AttachmentBuilder(coverBufferData, { name: 'cover.png' });
    embed.setThumbnail('attachment://cover.png');

    return [mangadexIcon, coverImage];
}

async function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function addMangaTags(manga, embed, locale, client) {
    // Separate the tags into groups
    const tags = manga.attributes.tags;
    const tagGroups = {
        content: [],
        format: [],
        genre: [],
        theme: []
    };

    // For each tag, add it to the corresponding group
    tags.forEach(tag => {
        if (!tag) return;
        tagGroups[tag.attributes.group].push(tag.attributes.name.en);
    });

    // Translate the tag groups
    const content = {
        name: await client.translate(locale, 'commands', 'manga.response.found.fields[6].name') || await client.translate('en', 'commands', 'manga.response.found.fields[6].name'),
        value: tagGroups.content.map(tag => tag).join(', ') || 'N/A',
        inline: true
    }
    const format = {
        name: await client.translate(locale, 'commands', 'manga.response.found.fields[7].name') || await client.translate('en', 'commands', 'manga.response.found.fields[7].name'),
        value: tagGroups.format.map(tag => tag).join(', ') || 'N/A',
        inline: true
    }
    const genre = {
        name: await client.translate(locale, 'commands', 'manga.response.found.fields[8].name') || await client.translate('en', 'commands', 'manga.response.found.fields[8].name'),
        value: tagGroups.genre.map(tag => tag).join(', ') || 'N/A',
        inline: true
    }
    const theme = {
        name: await client.translate(locale, 'commands', 'manga.response.found.fields[9].name') || await client.translate('en', 'commands', 'manga.response.found.fields[9].name'),
        value: tagGroups.theme.map(tag => tag).join(', ') || 'N/A',
        inline: true
    }

    // Add the translated tag groups to the embed
    embed.addFields(content, format, genre, theme);
}

async function checkIdFormat(id) {
    return idRegex.test(id);
}

async function getCoverURL(manga) {
    const mangaID = manga.id;
    const coverArtID = manga.relationships.find(rel => rel.type === 'cover_art').id;

    const url = new URL(`https://api.mangadex.org/cover/${coverArtID}`);
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const fileName = data.data.attributes.fileName;

    return `https://mangadex.org/covers/${mangaID}/${fileName}`;
}

async function getManga(mangaID) {
    const url = new URL(`https://api.mangadex.org/manga/${mangaID}`);
    url.searchParams.append('includes[]', 'author');
    url.searchParams.append('includes[]', 'artist');
    url.searchParams.append('includes[]', 'cover_art');
    url.searchParams.append('includes[]', 'tag');

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    return data.data;
}

async function getStats(mangaID) {
    const url = new URL(`https://api.mangadex.org/statistics/manga/${mangaID}`);

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    return data.statistics[mangaID];
}

async function getIDfromURL(url) {
    const match = url.match(urlRegex);
    if (!match) return null;
    return match[1];
}

async function getLocalizedDescription(manga, locale) {
    locale = languageMap[locale] || locale;

    let description = manga.attributes.description[locale] || null;
    if (description) return description;

    // If the locale is 'es', before trying with 'en', try with 'es-la'
    if (locale === 'es') {
        description = manga.attributes.description['es-la'] || null;
        if (description) return description;
    }

    return manga.attributes.description['en'] || null;
}

async function searchManga(query) {
    const url = new URL('https://api.mangadex.org/manga');
    url.searchParams.append('title', query);
    url.searchParams.append('limit', 10);
    url.searchParams.append('contentRating[]', 'safe');
    url.searchParams.append('contentRating[]', 'suggestive');
    url.searchParams.append('contentRating[]', 'erotica');
    url.searchParams.append('contentRating[]', 'pornographic');

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    if (data.data.length === 0) return null;
    const results = new Map(data.data.map(manga => [manga.attributes.title['en'], manga.id]));

    return results;
}