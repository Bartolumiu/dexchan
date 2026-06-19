/**
 * Retrieves title tags based on the specified type and locale.
 *
 * For 'mangadex' type, it extracts tag names from title.attributes.tags;
 * for 'namicomi' type, it extracts tag names from title.relationships using the provided locale.
 *
 * @param {object} title - The title object containing tag data.
 * @param {string} type - The type of title. Supported values are 'mangadex' and 'namicomi'.
 * @param {string|undefined|null} [locale=null] - The locale identifier for localized tag names (only used for 'namicomi').
 * @returns {object|null} An object containing grouped tag strings. For 'mangadex', keys include theme, genre, content, and format. 
 * For 'namicomi', keys include content_warning, format, genre, theme, and other. If a particular group has no tags, its value will be 'N/A'. 
 * Returns null if the type is unsupported.
 */
const getTitleTags = (title, type, locale = null) => {
    switch (type) {
        case 'mangabaka':
            return getMangaBakaTags(title);
        case 'mangadex':
            return getMangaDexTags(title);
        case 'namicomi':
            return getNamiComiTags(title, locale);
        default:
            return null; // Unsupported type
    }
}

/**
 * Merges arrays of tags into comma-separated strings or 'N/A' if empty.
 * @param {object} groups - An object containing arrays of tags to be merged.
 * @returns {object} A new object with the merged tags.
 */
const mergeTagArrays = (groups) => {
    return Object.fromEntries(
        Object.entries(groups).map(([key, tags]) => [
            key,
            tags.length === 0 ? 'N/A' : tags.splice(0, 10).join(', ')
        ])
    );
};

/**
 * Extracts and formats MangaBaka-specific tags from the title.
 *
 * Processes the title.tags, title.tags_v2, title.genres and title.genres_v2 arrays,
 * and returns an object with comma-separated tag strings. If a group has no tags, its value is set to 'N/A'.
 *
 * @param {object} title - The MangaBaka title object containing the necessary information.
 * @return {object} Grouped tags.
 */
const getMangaBakaTags = (title) => {
    const groups = {
        tags: title.tags || [],
        genres: title.genres || [],
        tags_v2: title.tags_v2?.map(tag => tag.name).filter(Boolean) || [],
        genres_v2: title.genres_v2?.map(genre => genre.name).filter(Boolean) || []
    };

    return mergeTagArrays(groups);
}

/**
 * Extracts and formats MangaDex-specific tags from the title.
 *
 * Processes the title.attributes.tags array, grouping tag names by their attribute group,
 * and returns an object with comma-separated tag strings. If a group has no tags, its value is set to 'N/A'.
 *
 * @param {object} title - The MangaDex title object containing an attributes.tags array.
 * @returns {object} Grouped tags.
 */
const getMangaDexTags = (title) => {
    const groups = {
        theme: [],
        genre: [],
        content: [],
        format: []
    };

    title.attributes?.tags?.forEach(tag => {
        const group = tag?.attributes?.group;
        const name = tag?.attributes?.name?.en;

        if (group && name && groups[group])
            groups[group].push(name);
    });

    return mergeTagArrays(groups);
}

/**
 * Extracts and formats NamiComi-specific tags based on the provided locale.
 *
 * Processes the title.relationships array by filtering for tag relationships. Based on the tag's group,
 * it selects a localised tag name (if available) or falls back to the English name. The tags are grouped
 * into content_warning, format, genre, theme, and other, with each group's names joined by commas.
 * Empty groups are represented by 'N/A'.
 *
 * @param {object} title - The NamiComi title object containing a relationships array with tag attributes.
 * @param {string} locale - The locale identifier to retrieve proper localised tag names.
 * @returns {object} Grouped tags.
 */
const getNamiComiTags = (title, locale) => {
    const groups = {
        content_warning: [],
        format: [],
        genre: [],
        theme: [],
        other: []
    };
    const validTypes = ['tag', 'primary_tag', 'secondary_tag'];

    const tags = title.relationships?.filter(rel => validTypes.includes(rel.type)) || [];

    tags.forEach(tag => {
        const group = tag?.attributes?.group;
        if (!group || !tag?.attributes?.name) return;

        const localizedName = tag.attributes.name[locale] || tag.attributes.name.en;

        if (group === 'content-warnings') {
            groups.content_warning.push(localizedName);
        } else if (groups[group]) {
            groups[group].push(localizedName);
        } else {
            groups.other.push(localizedName);
        }
    });

    return mergeTagArrays(groups);
}

/**
 * Adds title tags to the embed based on the title type.
 *
 * @param {object} title - The title object containing tag data.
 * @param {object} embed - The embed object to add fields to.
 * @param {object} translations - The translations object for field names.
 * @param {string} type - The type of title. Supported values are 'mangadex' and 'namicomi'.
 * @param {string|null} locale - The locale to use for tag names.
 * @returns {boolean|null} True if tags were added successfully, null if the type is unsupported.
 */
const addTitleTags = (title, embed, translations, type, locale) => {
    switch (type) {
        case 'mangabaka':
            return addMangaBakaTags(title, embed, translations);
        case 'mangadex':
            return addMangaDexTags(title, embed, translations);
        case 'namicomi':
            return addNamiComiTags(title, embed, translations, locale);
        default:
            return null; // Unsupported type
    }
}

/**
 * Adds MangaBaka-specific tags to the embed.
 *
 * @param {object} title - The MangaBaka title object.
 * @param {object} embed - The embed object to add fields to.
 * @param {object} translations - The translations object for field names.
 */
const addMangaBakaTags = (title, embed, translations) => {
    const groups = getTitleTags(title, 'mangabaka');
    const fields = [
        { name: translations.response.embed.fields.genres, value: groups.genres, inline: true },
        { name: translations.response.embed.fields.tags, value: groups.tags, inline: true },
        { name: translations.response.embed.fields.genres_v2, value: groups.genres_v2, inline: true },
        { name: translations.response.embed.fields.tags_v2, value: groups.tags_v2, inline: true }
    ];
    embed.addFields(fields);
    return true;
}

/**
 * Adds MangaDex-specific tags to the embed.
 *
 * @param {object} title - The MangaDex title object.
 * @param {object} embed - The embed object to add fields to.
 * @param {object} translations - The translations object for field names.
 */
const addMangaDexTags = (title, embed, translations) => {
    const groups = getTitleTags(title, 'mangadex');
    const fields = [
        { name: translations.response.embed.fields.format, value: groups.format, inline: true },
        { name: translations.response.embed.fields.genres, value: groups.genre, inline: true },
        { name: translations.response.embed.fields.themes, value: groups.theme, inline: true },
        { name: translations.response.embed.fields.content_warning, value: groups.content, inline: true }
    ];

    embed.addFields(fields);
    return true;
};

/**
 * Adds NamiComi-specific tags to the embed.
 *
 * @param {object} title - The NamiComi title object.
 * @param {object} embed - The embed object to add fields to.
 * @param {object} translations - The translations object for field names.
 * @param {string} locale - The locale to use for tag names.
 */
const addNamiComiTags = (title, embed, translations, locale) => {
    const groups = getTitleTags(title, 'namicomi', locale);
    const fields = [
        { name: translations.response.embed.fields.format, value: groups.format, inline: true },
        { name: translations.response.embed.fields.genres, value: groups.genre, inline: true },
        { name: translations.response.embed.fields.themes, value: groups.theme, inline: true },
        { name: translations.response.embed.fields.content_warning, value: groups.content_warning, inline: true },
        { name: translations.response.embed.fields.other_tags, value: groups.other, inline: true }
    ];

    embed.addFields(fields);
    return true;
}

module.exports = { getTitleTags, addTitleTags }