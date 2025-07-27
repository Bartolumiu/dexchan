const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    namicomi: 'https://uploads.namicomi.com/media/manga/'
}

/**
 * Retrieves the banner image for a given title.
 * @param {Object} title - The title object containing the necessary data.
 * @param {string} type - The type of title, expected to be 'namicomi' for now (will be extended in the future).
 * @returns {Promise<Buffer|null>} A promise that resolves to the banner image as a Buffer, or null if not found.
 */
const getBanner = async (title, type) => {
    return await getNamiComiBanner(title);
}

/**
 * Builds the URL for the NamiComi banner image.
 * @param {Object} title - The title object containing the necessary data.
 * @param {string} type - The type of title, expected to be 'namicomi'.
 * @returns {URL|null} A URL object for the banner image if found; otherwise, null.
 */
const buildURL = (title, type) => {
    const id = title.id;
    const fileName = title.attributes?.bannerFileName;
    if (!fileName) return null;
    return new URL(`${URL_FORMATS.namicomi}${id}/banner/${fileName}`);
};

/**
 * Retrieves the banner image for a given title from NamiComi.
 *
 * This function constructs a URL using the provided title object, fetches the banner image,
 * and returns it as a Buffer. If the request fails or the banner is not found, it returns null.
 *
 * @param {Object} title - The title object containing the necessary data.
 * @returns {Promise<Buffer|null>} A promise that resolves to the banner image as a Buffer, or null if not found.
 */
const getNamiComiBanner = async (title) => {
    const url = buildURL(title, 'namicomi');
    try {
        const res = await fetch(url, {
            method: 'GET',
            timeout: 5000,
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        return Buffer.from(buffer);
    } catch {
        return null;
    };
};

module.exports = getBanner;