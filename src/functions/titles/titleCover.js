const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    mangadex: 'https://mangadex.org/covers/',
    namicomi: 'https://uploads.namicomi.com/covers/'
}

/**
 * Retrieves the cover image for a given title based on the specified type and locale.
 *
 * @param {string} title - The title for which the cover image is requested.
 * @param {string} type - The source type for the cover image. Supported values are "mangadex" and "namicomi".
 * @param {string|null} [locale=null] - The locale used for fetching the cover image, applicable for some types.
 * @returns {Promise<*>} A promise that resolves to the cover image data.
 * @throws {Error} If an unsupported type is provided.
 */
const getCover = async (title, type, locale = null) => {
    switch (type) {
        case 'mangadex':
            return await getMangaDexCover(title);
        case 'namicomi':
            return await getNamiComiCover(title, locale);
        default:
            throw new Error('Unsupported type');
    }
}

/**
 * Builds a URL for a title's cover image based on the specified type.
 *
 * @param {Object} title - The title object containing the necessary data.
 * @param {string} title.id - The title ID.
 * @param {Array<Object>} title.relationships - An array of relationship objects that include cover art information.
 * @param {string} type - The service type for which the URL is built ('mangadex' or 'namicomi').
 * @param {string} [locale=null] - Optional locale filter used when the type is 'namicomi' to select the appropriate cover art.
 * @returns {URL|null} A URL object for the cover image if found; otherwise, null.
 */
const buildURL = (title, type, locale = null) => {
    switch (type) {
        case 'mangadex': {
            const id = title.id;
            const coverName = title.relationships.find(rel => rel.type === 'cover_art').attributes.fileName;
            return new URL(`${URL_FORMATS.mangadex}${id}/${coverName}.512.jpg`);
        }
        case 'namicomi': {
            const id = title.id;
            const covers = title.relationships.filter(rel => rel.type === 'cover_art');
            let coverName = covers.find(rel => rel.attributes.locale === locale)?.attributes?.fileName;
            if (!coverName && covers.length > 0) coverName = covers[0]?.attributes?.fileName;
            if (!coverName) return null;
            return new URL(`${URL_FORMATS.namicomi}${id}/${coverName}.512.jpg`);
        }
    }
}

/**
 * Retrieves the cover image for the specified MangaDex title.
 *
 * This function constructs the appropriate URL using the provided title and attempts
 * to fetch the cover image. If the request is successful, it returns a Buffer containing
 * the image data. If the request fails or the response is not OK, it returns null.
 *
 * @param {Object} title - The title object for which the cover image is being fetched.
 * @returns {Promise<Buffer|null>} A promise that resolves to a Buffer with the cover image data, or null if unsuccessful.
 */
const getMangaDexCover = async (title) => {
    const url = buildURL(title, 'mangadex');
    try {
        const res = await fetch(url, {
            method: 'GET',
            timeout: 5000,
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        });
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        return Buffer.from(buffer);
    } catch (err) {
        return null;
    };
}

/**
 * Retrieves the cover image for the specified NamiComi title.
 *
 * This function builds a URL based on the provided title and locale, then sends a GET request
 * with appropriate headers to fetch the cover image data. If the response status is not OK or an error occurs,
 * the function returns null. Otherwise, it returns a Buffer containing the image data.
 *
 * @param {Object} title - The title object for which the cover image is being fetched.
 * @param {string} locale - The locale used to build the URL for the request.
 * @returns {Promise<Buffer|null>} A promise that resolves to a Buffer with the cover image data, or null if the fetch fails.
 */
const getNamiComiCover = async (title, locale) => {
    const url = buildURL(title, 'namicomi', locale);
    try {
        const res = await fetch(url, {
            method: 'GET',
            timeout: 5000,
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        });
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        return Buffer.from(buffer);
    } catch (err) {
        return null;
    };
}

module.exports = getCover;