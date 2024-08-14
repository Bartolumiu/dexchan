const { SlashCommandBuilder, EmbedBuilder, Colors, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder } = require("discord.js");
const path = require('path');

const urlRegex = /^https?:\/\/(?:www\.)?(?:(?:canary|sandbox)\.)?mangadex\.(?:org|dev)\/title\/([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})(?:\/[a-zA-Z0-9-]+)?\/?$/;
const idRegex = /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/;

const urlFormats = {
    primary: 'https://mangadex.org/title/{id}/{title}',
    canary: 'https://canary.mangadex.dev/title/{id}/{title}',
    sandbox: 'https://sandbox.mangadex.dev/title/{id}/{title}'
};

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
        const locale = interaction.locale;
        const embed = new EmbedBuilder()
            .setFooter({
                text: await client.translate(locale, 'commands', 'manga.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username }),
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            });

        const query = interaction.options.getString('query');
        const id = interaction.options.getString('id');
        const url = interaction.options.getString('url');

        if (!query && !id && !url) return sendErrorEmbed(interaction, client, locale, embed, 'manga.response.error.description.empty');

        if (query) {
            const searchResults = await searchManga(query);

            if (!searchResults) return sendErrorEmbed(interaction, client, locale, embed, 'manga.response.error.description.no_results');

            const fields = Array.from(searchResults, ([title, id]) => ({
                name: title,
                value: `[View Manga](${urlFormats.primary.replace('{id}', id).replace('{title}', '')})`
            }));

            const menu = new StringSelectMenuBuilder()
                .setCustomId('manga_select')
                .setPlaceholder(await client.translate(locale, 'commands', 'manga.response.query.placeholder'))
                .setMinValues(1)
                .setMaxValues(1);

            let menuOptions = [];
            searchResults.forEach((id, title) => {
                menuOptions.push({ label: title, value: id });
            });
            menu.setOptions(menuOptions);

            const row = new ActionRowBuilder().addComponents(menu);

            embed.setTitle(await client.translate(locale, 'commands', 'manga.response.query.title'))
                .setDescription(await client.translate(locale, 'commands', 'manga.response.query.description', { query: query }))
                .addFields(fields)
                .setColor(Colors.Blurple);

            return interaction.reply({ embeds: [embed], components: [row] });
        }

        const mangaID = id || await getIDfromURL(url);
        if (!(await checkIdFormat(mangaID))) return sendErrorEmbed(interaction, client, locale, embed, 'manga.response.error.description.id');

        const [manga, stats] = await Promise.all([getManga(mangaID), getStats(mangaID)]);
        if (!manga || !stats) return sendErrorEmbed(interaction, client, locale, embed, 'manga.response.error.description.id');

        await buildMangaEmbed(embed, client, locale, manga, stats);
        const attachments = await setImages(manga, embed, locale, client);

        const open_button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(await client.translate(locale, 'commands', 'manga.response.found.open_button'))
                .setURL(urlFormats.primary.replace('{id}', manga.id).replace('{title}', ''))
                .setStyle(ButtonStyle.Link)
        )

        return interaction.reply({ embeds: [embed], files: attachments, components: [open_button] });
    }
}

async function sendErrorEmbed(interaction, client, locale, embed, errorKey) {
    embed.setTitle(await client.translate(locale, 'commands', 'manga.response.error.title'))
        .setDescription(await client.translate(locale, 'commands', errorKey))
        .setColor(Colors.Red);

    return interaction.reply({ embeds: [embed] });
}

async function buildMangaEmbed(embed, client, locale, manga, stats) {
    const title = manga.attributes.title.en;
    const description = await getLocalizedDescription(manga, locale) || await client.translate(locale, 'commands', 'manga.response.found.no_description');
    const author = await getCreators(manga, locale, client);

    const fields = [
        { name: await client.translate(locale, 'commands', 'manga.response.found.fields[0].name'), value: `${stats.rating.bayesian.toFixed(2)}`, inline: true },
        { name: await client.translate(locale, 'commands', 'manga.response.found.fields[1].name'), value: `${stats.follows}`, inline: true },
        { name: await client.translate(locale, 'commands', 'manga.response.found.fields[2].name'), value: `${manga.attributes.year}`, inline: true },
        { name: await client.translate(locale, 'commands', 'manga.response.found.fields[3].name'), value: await capitalizeFirstLetter(await client.translate(locale, 'commands', `manga.response.found.pub_status.${manga.attributes.status}`) || manga.attributes.status), inline: true },
        { name: await client.translate(locale, 'commands', 'manga.response.found.fields[4].name'), value: await capitalizeFirstLetter(manga.attributes.publicationDemographic || 'N/A'), inline: true },
        { name: await client.translate(locale, 'commands', 'manga.response.found.fields[5].name'), value: await capitalizeFirstLetter(manga.attributes.contentRating), inline: true }
    ];

    embed.setTitle(title)
        .setURL(urlFormats.primary.replace('{id}', manga.id).replace('{title}', ''))
        .setDescription(description)
        .addFields(fields)
        .setColor(Colors.Blurple);

    await addMangaTags(manga, embed, locale, client);
    embed.setAuthor({ name: author, iconURL: 'attachment://mangadex.png' });
}

async function getCreators(manga, locale, client) {
    const creatorsAndArtists = Array.from(new Set([
        ...manga.relationships.filter(rel => rel.type === 'author').map(rel => rel.attributes.name),
        ...manga.relationships.filter(rel => rel.type === 'artist').map(rel => rel.attributes.name)
    ])).join(', ');

    return (creatorsAndArtists.length > 256)
        ? await client.translate(locale, 'commands', 'manga.response.found.author.too_many')
        : creatorsAndArtists;
}

async function setImages(manga, embed, locale, client) {
    const author = await getCreators(manga, locale, client);
    const mangadexIcon = new AttachmentBuilder(path.join(__dirname, '../../media/mangadex.png'), 'mangadex.png');
    embed.setAuthor({ name: author, iconURL: 'attachment://mangadex.png' })

    const coverURL = await getCoverURL(manga);
    if (!coverURL) return [mangadexIcon];

    const cover = await fetch(coverURL);
    if (!cover.ok) return [mangadexIcon];

    const coverBuffer = await cover.arrayBuffer();
    const coverImage = new AttachmentBuilder(Buffer.from(coverBuffer), { name: 'cover.png' });
    embed.setThumbnail('attachment://cover.png');

    return [mangadexIcon, coverImage];
}

async function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function addMangaTags(manga, embed, locale, client) {
    const tagGroups = {
        content: [],
        format: [],
        genre: [],
        theme: []
    };

    // For each tag, add it to the corresponding group
    manga.attributes.tags.forEach(tag => {
        if (!tag) return;
        tagGroups[tag.attributes.group].push(tag.attributes.name.en);
    });

    const fields = [
        {
            name: await client.translate(locale, 'commands', 'manga.response.found.fields[6].name'),
            value: tagGroups.content.join(', ') || 'N/A',
            inline: true
        },
        {
            name: await client.translate(locale, 'commands', 'manga.response.found.fields[7].name'),
            value: tagGroups.format.join(', ') || 'N/A',
            inline: true
        },
        {
            name: await client.translate(locale, 'commands', 'manga.response.found.fields[8].name'),
            value: tagGroups.genre.join(', ') || 'N/A',
            inline: true
        },
        {
            name: await client.translate(locale, 'commands', 'manga.response.found.fields[9].name'),
            value: tagGroups.theme.join(', ') || 'N/A',
            inline: true
        }
    ];

    embed.addFields(fields);
}

async function getIDfromURL(url) {
    const match = url.match(urlRegex);
    return (match) ? match[1] : null;
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

async function getLocalizedDescription(manga, locale) {
    locale = languageMap[locale] || locale;

    let description = manga.attributes.description[locale];

    if (!description && locale === 'es') description = manga.attributes.description['es-la'];
    
    if (!description) description = manga.attributes.description['en'];

    return description || await client.translate(locale, 'commands', 'manga.response.found.no_description');
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