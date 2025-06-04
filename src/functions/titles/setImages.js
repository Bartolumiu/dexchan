const { AttachmentBuilder } = require("discord.js");
const getTitleCreators = require("./titleCreators");
const getCover = require("./titleCover");
const getBanner = require("./titleBanner");
const path = require("path");

const setImages = async (title, embed, type, { translations = null, locale = null }) => {
    switch (type) {
        case 'mangadex':
            return await setMangaDexImages(title, embed, translations);
        case 'namicomi':
            return await setNamiComiImages(title, embed, locale);
        default:
            throw new Error('Unsupported type');
    }
}

const setMangaDexImages = async (title, embed, translations) => {
    let authors = getTitleCreators(title, 'mangadex');
    if (!authors) authors = translations.embed.error.no_authors;
    if (authors.length > 256) authors = translations.embed.error.too_many_authors;

    const mdIcon = new AttachmentBuilder(path.join(__dirname, '../../assets/logos/mangadex.png'), 'mangadex.png');
    embed.setAuthor({ name: authors, iconURL: 'attachment://mangadex.png' });

    const coverBuffer = await getCover(title, 'mangadex');
    if (!coverBuffer) return [mdIcon];

    const coverImage = new AttachmentBuilder(coverBuffer, { name: 'cover.jpg' });
    embed.setThumbnail('attachment://cover.jpg');

    return [mdIcon, coverImage];
};

const setNamiComiImages = async (title, embed, locale) => {
    const author = getTitleCreators(title, 'namicomi');
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