const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    mangadex: 'https://api.mangadex.org/manga/',
    namicomi: 'https://api.namicomi.com/title/'
}

/**
 * Retrieves details for a given ID.
 * 
 * @async
 * @function getTitleDetails
 * @param {string|number} id - The ID of the title.
 * @param {string} type - The service to use, either 'mangadex' or 'namicomi'.
 * @returns {Promise<Object|null>} A promise that resolves to the details object if successful, or null if the request fails or an error occurs.
 * @throws {Error} If the type is unsupported.
 */
const getTitleDetails = async (id, type) => {
    switch (type) {
        case 'mangadex':
            return await getMangaDexDetails(id);
        case 'namicomi':
            return await getNamiComiDetails(id);
        default:
            throw new Error('Unsupported type');
    }
}

/**
 * Builds a URL object by appending specific search parameters based on the given type.
 * 
 * @param {string|number} id - The ID of the title.
 * @param {string} type - The type of search, expected to be either 'mangadex' or 'namicomi'.
 * @returns {URL} The constructed URL object with query parameters.
 */
const buildURL = (id, type) => {
    const url = new URL(URL_FORMATS[type]);
    switch (type) {
        case 'mangadex':
            url.pathname += id;
            url.searchParams.append('includes[]', 'author');
            url.searchParams.append('includes[]', 'artist');
            url.searchParams.append('includes[]', 'cover_art');
            url.searchParams.append('includes[]', 'tag');
            return url;
        case 'namicomi':
            url.pathname += id;
            url.searchParams.append('includes[]', 'organization');
            url.searchParams.append('includes[]', 'cover_art');
            url.searchParams.append('includes[]', 'tag');
            return url;
    }
}

/**
 * Retrieves details for a given ID from the MangaDex API.
 * 
 * This function builds a URL using the provided ID and fetches the corresponding
 * JSON data from the MangaDex API. If the response is successful, it extracts and
 * returns the relevant data property; otherwise, it returns null.
 * 
 * @async
 * @function getMangaDexDetails
 * @param {string} id - The identifier used to fetch the details.
 * @returns {Promise<Object|null>} A promise that resolves to the details object if successful, or null if the request fails or an error occurs.
 */
const getMangaDexDetails = async (id) => {
    const url = buildURL(id, 'mangadex');
    try {
        const response = await fetch(url, {
            method: 'GET',
            timeout: 5000,
            headers: {
                'User-Agent': USER_AGENT,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.data;
    } catch (err) {
        return null;
    }
};

/**
 * Retrieves details for a given ID from the NamiComi API.
 *
 * This function builds a URL using the provided ID and fetches the corresponding
 * JSON data from the NamiComi API. If the response is successful, it extracts and
 * returns the relevant data property; otherwise, it returns null.
 *
 * @async
 * @function getNamiComiDetails
 * @param {string} id - The identifier used to fetch the details.
 * @returns {Promise<Object|null>} A promise that resolves to the details object if successful, or null if the request fails or an error occurs.
 */
const getNamiComiDetails = async (id) => {
    const url = buildURL(id, 'namicomi');

    try {
        const response = await fetch(url, {
            method: 'GET',
            timeout: 5000,
            headers: {
                'User-Agent': USER_AGENT,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.data;
    } catch (err) {
        return null;
    };
};

module.exports = getTitleDetails;