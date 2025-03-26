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

module.exports = getTitleTags;