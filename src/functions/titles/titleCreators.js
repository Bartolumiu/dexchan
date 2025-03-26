/**
 * Returns a comma-separated string of title creators based on the provided type.
 *
 * @param {Object} title - The title object containing relationships.
 * @param {string} type - The type of title. Valid values are 'mangadex' and 'namicomi'.
 * @returns {string} A comma-separated list of creators.
 * @throws {Error} Throws an error if the type is unsupported.
 */
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

/**
 * Extracts and returns a comma-separated string of unique creators (authors and artists)
 * from the provided title object for the 'mangadex' type.
 *
 * @param {Object} title - The title object containing relationships.
 * @returns {string} A comma-separated list of authors and artists.
 */
const getMangaDexCreators = (title) => {
    const creatorsAndArtists = Array.from(new Set(title.relationships.filter(rel => rel.type === 'author' || rel.type === 'artist').map(rel => rel.attributes.name))).join(', ');
    return creatorsAndArtists;
}

/**
 * Extracts and returns a comma-separated string of unique organizations
 * from the provided title object for the 'namicomi' type.
 * In reality, there's only one organization per title, but this function is designed to handle multiple (just in case something changes in the future).
 *
 * @param {Object} title - The title object containing relationships.
 * @returns {string} A comma-separated list of organizations.
 */
const getNamiComiCreators = (title) => {
    const creators = Array.from(new Set(title.relationships.filter(rel => rel.type === 'organization').map(rel => rel.attributes.name))).join(', ');
    return creators;
};

module.exports = getTitleCreators;