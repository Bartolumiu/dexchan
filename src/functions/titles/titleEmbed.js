const { Colors } = require("discord.js");
const { addTitleTags } = require("./titleTags");
const capitalizeFirstLetter = require("../tools/capitalizeFirstLetter");
const getLocalizedDescription = require("./localizedDescription");
const getLocalizedTitle = require("./localizedTitle");
const { urlFormats } = require('../parsers/urlParser');
const truncateString = require("../tools/truncateString");

const buildTitleEmbed = (embed, locale, title, stats, translations, type) => {
    switch (type) {
        case 'mangadex':
            return buildMangaDexEmbed(embed, locale, title, stats, translations);
        case 'namicomi':
            return buildNamiComiEmbed(embed, locale, title, stats, translations);
        default:
            throw new Error('Unsupported type');
    }
}

const buildMangaDexEmbed = (embed, locale, title, stats, translations) => {
    const embedTitle = getLocalizedTitle(title, 'mangadex', locale);
    let embedDescription = getLocalizedDescription(title, 'mangadex', locale) || translations.embed.error.no_description;
    embedDescription = sanitizeDescription(embedDescription);
    embedDescription = truncateString(embedDescription, 4096);

    const fields = [
        { name: translations.embed.fields.rating, value: `${stats.rating.bayesian.toFixed(2)}`, inline: true },
        { name: translations.embed.fields.follows, value: `${stats.follows}`, inline: true },
        { name: translations.embed.fields.year, value: `${title.attributes.year}`, inline: true },
        { name: translations.embed.fields.pub_status.name, value: capitalizeFirstLetter(`${translations.embed.fields.pub_status.value[title.attributes.status] || title.attributes.status}`), inline: true },
        { name: translations.embed.fields.demographic.name, value: title.attributes.publicationDemographic ? capitalizeFirstLetter(`${translations.embed.fields.demographic.value[title.attributes.publicationDemographic] || title.attributes.publicationDemographic}`) : 'N/A', inline: true },
        { name: translations.embed.fields.content_rating.name, value: capitalizeFirstLetter(`${translations.embed.fields.content_rating.value[title.attributes.contentRating] || title.attributes.contentRating}`), inline: true }
    ];

    embed.setTitle(embedTitle)
        .setURL(urlFormats.mangadex.primary.replace('{id}', title.id).replace('{title}', ''))
        .setDescription(embedDescription)
        .addFields(fields)
        .setColor(Colors.Blurple);

    addTitleTags(title, embed, translations, 'mangadex');
};

const buildNamiComiEmbed = (embed, locale, title, stats, translations) => {
    const embedTitle = getLocalizedTitle(title, 'namicomi', locale);
    let embedDescription = getLocalizedDescription(title, 'namicomi', locale) || translations.embed.error.no_description;
    embedDescription = sanitizeDescription(embedDescription);
    embedDescription = truncateString(embedDescription, 4096);

    const fields = [
        { name: translations.embed.fields.rating, value: `${stats.rating.bayesian.toFixed(2)}`, inline: true },
        { name: translations.embed.fields.follows, value: `${stats.follows}`, inline: true },
        { name: translations.embed.fields.year, value: `${title.attributes.year}`, inline: true },
        { name: translations.embed.fields.pub_status.name, value: capitalizeFirstLetter(`${translations.embed.fields.pub_status.value[title.attributes.publicationStatus] || title.attributes.publicationStatus}`), inline: true },
        { name: translations.embed.fields.demographic.name, value: title.attributes.demographic ? capitalizeFirstLetter(`${translations.embed.fields.demographic.value[title.attributes.demographic] || title.attributes.demographic}`) : 'N/A', inline: true },
        { name: translations.embed.fields.content_rating.name, value: capitalizeFirstLetter(`${translations.embed.fields.content_rating.value[title.attributes.contentRating] || title.attributes.contentRating}`), inline: true }
    ];

    embed.setTitle(embedTitle)
        .setURL(urlFormats.namicomi.shortened.replace('{id}', title.id))
        .setDescription(embedDescription)
        .addFields(fields)
        .setColor(Colors.Blurple);

    addTitleTags(title, embed, translations, 'namicomi', locale);

    switch (title.attributes.readingMode) {
        case 'vls':
            embed.addFields({ name: translations.embed.fields.reading_mode.name, value: translations.embed.fields.reading_mode.vertical });
            break;
        case 'rtl':
            embed.addFields({ name: translations.embed.fields.reading_mode.name, value: translations.embed.fields.reading_mode.horizontal.right_to_left });
            break;
        case 'ltr':
            embed.addFields({ name: translations.embed.fields.reading_mode.name, value: translations.embed.fields.reading_mode.horizontal.left_to_right });
            break;
    };
};

const sanitizeDescription = (description) => {
    description = description.replace(/<br\s*\/?>/g, '\n'); // Replace <br> tags with newlines
    description = description.replace(/<[\w/!][^<>]*?>/g, ''); // Remove any remaining HTML tags (non-greedy, prevents ReDoS)
    description = description.replace(/\n+/g, '\n'); // Normalize multiple newlines to a single newline
    description = description.trim(); // Trim leading and trailing whitespace
    return description;
};

module.exports = buildTitleEmbed;