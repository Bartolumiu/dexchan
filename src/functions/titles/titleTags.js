/**
 * Retrieves title tags based on the specified type and locale.
 *
 * For 'mangadex' type, it extracts tag names from title.attributes.tags;
 * for 'namicomi' type, it extracts tag names from title.relationships using the provided locale.
 *
 * @param {object} title - The title object containing tag data.
 * @param {string} type - The type of title. Supported values are 'mangadex' and 'namicomi'.
 * @param {string} [locale=null] - The locale identifier for localized tag names (only used for 'namicomi').
 * @returns {object} An object containing grouped tag strings. For 'mangadex', keys include theme, genre, content, and format.
 *                   For 'namicomi', keys include content_warning, format, genre, theme, and other.
 *                   If a particular group has no tags, its value will be 'N/A'.
 * @throws {Error} Throws an error if the provided type is unsupported.
 */
const getTitleTags = (title, type, locale = null) => {
    switch (type) {
        case 'mangadex':
            return getMangaDexTags(title);
        case 'namicomi':
            return getNamiComiTags(title, locale);
        default:
            throw new Error('Unsupported type');
    }
}

/**
 * Extracts and formats MangaDex-specific tags from the title.
 *
 * Processes the title.attributes.tags array, grouping tag names by their attribute group,
 * and returns an object with comma-separated tag strings. If a group has no tags, its value is set to 'N/A'.
 *
 * @param {object} title - The MangaDex title object containing an attributes.tags array.
 * @returns {object} An object with keys: theme, genre, content, and format, each containing comma-separated tag names or 'N/A' if empty.
 */
const getMangaDexTags = (title) => {
    const groups = {
        theme: [],
        genre: [],
        content: [],
        format: []
    };

    title.attributes.tags.forEach(tag => {
        if (!tag?.attributes?.group || !tag?.attributes?.name) return;
        groups[tag.attributes.group].push(tag.attributes.name.en);
    });

    Object.keys(groups).forEach(key => {
        groups[key] = groups[key].join(', ');
    });

    for (const key in groups) {
        if (groups[key].length === 0) {
            groups[key] = 'N/A';
        }
    }

    return groups;
}

/**
 * Extracts and formats NamiComi-specific tags based on the provided locale.
 *
 * Processes the title.relationships array by filtering for tag relationships. Based on the tag's group,
 * it selects a localized tag name (if available) or falls back to the English name. The tags are grouped
 * into content_warning, format, genre, theme, and other, with each group's names joined by commas.
 * Empty groups are represented by 'N/A'.
 *
 * @param {object} title - The NamiComi title object containing a relationships array with tag attributes.
 * @param {string} locale - The locale identifier to retrieve proper localized tag names.
 * @returns {object} An object with keys: content_warning, format, genre, theme, and other, each containing comma-separated tag names or 'N/A' if empty.
 */
const getNamiComiTags = (title, locale) => {
    const groups = {
        content_warning: [],
        format: [],
        genre: [],
        theme: [],
        other: []
    };

    const tags = title.relationships.filter(rel => rel.type === 'tag' || rel.type === 'primary_tag' || rel.type === 'secondary_tag');
    tags.forEach(tag => {
        if (!tag?.attributes?.group || !tag?.attributes?.name) return;
        switch (tag.attributes.group) {
            case 'content-warnings':
                groups.content_warning.push(tag.attributes.name.en);
                break;
            case 'format':
                groups.format.push(tag.attributes.name[locale] || tag.attributes.name.en);
                break;
            case 'genre':
                groups.genre.push(tag.attributes.name[locale] || tag.attributes.name.en);
                break;
            case 'theme':
                groups.theme.push(tag.attributes.name[locale] || tag.attributes.name.en);
                break;
            default:
                groups.other.push(tag.attributes.name[locale] || tag.attributes.name.en);
                break;
        }
    });

    Object.keys(groups).forEach(key => {
        groups[key] = groups[key].join(', ');
    });

    for (const key in groups) {
        if (groups[key].length === 0) {
            groups[key] = 'N/A';
        }
    }

    return groups;
}


const addTitleTags = (title, embed, translations, type, locale) => {
    switch (type) {
        case 'mangadex':
            return addMangaDexTags(title, embed, translations);
        case 'namicomi':
            return addNamiComiTags(title, embed, translations, locale);
        default:
            throw new Error('Unsupported type');
    }
}

const addMangaDexTags = (title, embed, translations) => {
    const groups = getTitleTags(title, 'mangadex');
    const fields = [
        { name: translations.embed.fields.format, value: groups.format, inline: true },
        { name: translations.embed.fields.genres, value: groups.genre, inline: true },
        { name: translations.embed.fields.themes, value: groups.theme, inline: true },
        { name: translations.embed.fields.content_warning, value: groups.content, inline: true }
    ];

    embed.addFields(fields);
};

const addNamiComiTags = (title, embed, translations, locale) => {
    const groups = getTitleTags(title, 'namicomi', locale);
    const fields = [
        { name: translations.embed.fields.format, value: groups.format, inline: true },
        { name: translations.embed.fields.genres, value: groups.genre, inline: true },
        { name: translations.embed.fields.themes, value: groups.theme, inline: true },
        { name: translations.embed.fields.content_warning, value: groups.content_warning, inline: true },
        { name: translations.embed.fields.other_tags, value: groups.other, inline: true }
    ];

    embed.addFields(fields);
}

module.exports = { getTitleTags, addTitleTags }