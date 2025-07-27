const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const getTitleCreators = require("./titleCreators");
const getCover = require("./titleCover");
const getBanner = require("./titleBanner");
const path = require("path");

/**
 * Sets the images for the embed based on the title and type.
 * @param {Object} title - The title object containing the necessary data.
 * @param {EmbedBuilder} embed - The embed object to modify.
 * @param {string} type - The type of title, either 'mangadex' or 'namicomi'.
 * @param {Object} translations - The translations object for error messages.
 * @param {string|null} [locale=null] - The locale to use for fetching the cover image.
 * @returns {Promise<Array<AttachmentBuilder>>} A promise that resolves to an array of attachment builders containing the images or an empty array if the type is unsupported.
 * If the type is unsupported, it returns an empty array immediately.
 */
const setImages = async (title, embed, type, translations, locale = null) => {
    switch (type) {
        case 'mangadex':
            return await setMangaDexImages(title, embed, translations);
        case 'namicomi':
            return await setNamiComiImages(title, embed, translations, locale);
        default:
            return []; // Unsupported type, return empty array
    }
}

/**
 * Sets the MangaDex images for the embed.
 * @param {Object} title - The title object containing the necessary data.
 * @param {Object} embed - The embed object to modify.
 * @param {Object} translations - The translations object for error messages.
 * @returns {Promise<Array<AttachmentBuilder>>} A promise that resolves to an array of attachment builders.
 */
const setMangaDexImages = async (title, embed, translations) => {
    let authors = getTitleCreators(title, 'mangadex');
    if (!authors) authors = translations.embed.error.unknown_author;
    if (authors.length > 256) authors = translations.embed.error.too_many_authors;

    const mdIcon = new AttachmentBuilder(path.join(__dirname, '../../assets/logos/mangadex.png'), 'mangadex.png');
    embed.setAuthor({ name: authors, iconURL: 'attachment://mangadex.png' });

    const coverBuffer = await getCover(title, 'mangadex');
    if (!coverBuffer) return [mdIcon];

    const coverImage = new AttachmentBuilder(coverBuffer, { name: 'cover.jpg' });
    embed.setThumbnail('attachment://cover.jpg');

    return [mdIcon, coverImage];
};

/**
 * Sets the NamiComi images for the embed.
 * @param {Object} title - The title object containing the necessary data.
 * @param {Object} embed - The embed object to modify.
 * @param {Object} translations - The translations object for error messages.
 * @param {string} locale - The locale to use for fetching the cover image.
 * @returns {Promise<Array<AttachmentBuilder>>} A promise that resolves to an array of attachment builders.
 */
const setNamiComiImages = async (title, embed, translations, locale) => {
    let author = getTitleCreators(title, 'namicomi');
    if (!author) author = translations.embed.error.unknown_author;
    if (author.length > 256) author = translations.embed.error.too_many_authors;

    const ncIcon = new AttachmentBuilder(path.join(__dirname, '../../assets/logos/namicomi.png'), 'namicomi.png');
    embed.setAuthor({ name: author, iconURL: 'attachment://namicomi.png' });

    const coverBuffer = await getCover(title, 'namicomi', locale);
    if (!coverBuffer) return [ncIcon];

    const coverImage = new AttachmentBuilder(Buffer.from(coverBuffer), { name: 'cover.jpg' });
    embed.setThumbnail('attachment://cover.jpg');

    const bannerBuffer = await getBanner(title, 'namicomi');
    if (!bannerBuffer) return [ncIcon, coverImage];

    const bannerImage = new AttachmentBuilder(Buffer.from(bannerBuffer), { name: 'banner.jpg' });
    embed.setImage('attachment://banner.jpg');

    return [ncIcon, coverImage, bannerImage];
};

module.exports = setImages;