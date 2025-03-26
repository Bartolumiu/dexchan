const getTitleCreators = (title, type) => {
    switch (type) {
        case 'mangadex':
            return getMangaDexCreators(title);
        case 'namicomi':
            return getNamiComiCreators(title);
        default:
            throw new Error('Unsupported type');
    }
}

const getMangaDexCreators = (title) => {
    const creatorsAndArtists = Array.from(new Set(title.relationships.filter(rel => rel.type === 'author' || rel.type === 'artist').map(rel => rel.attributes.name))).join(', ');
    return creatorsAndArtists;
}

const getNamiComiCreators = (title) => {
    const creators = Array.from(new Set(title.relationships.filter(rel => rel.type === 'organization').map(rel => rel.attributes.name))).join(', ');
    return creators;
};

module.exports = getTitleCreators;