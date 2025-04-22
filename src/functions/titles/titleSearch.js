const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    mangadex: 'https://api.mangadex.org/manga',
    namicomi: 'https://api.namicomi.com/title/search'
}

const search = async (query, type, locale = null) => {
    switch (type) {
        case 'mangadex':
            return await searchMangaDex(query);
        case 'namicomi':
            return await searchNamiComi(query, locale || 'en');
        default:
            throw new Error('Unsupported search type');
    };
};

/**
 * Builds a URL object by appending specific search parameters based on the given type.
 *
 * @param {string} query - The search query string.
 * @param {string} type - The type of search, expected to be either 'mangadex' or 'namicomi'.
 * @returns {URL} The constructed URL object with query parameters.
 */
const buildURL = (query, type) => {
    const url = new URL(URL_FORMATS[type]);
    switch (type) {
        case 'mangadex':
            url.searchParams.append('title', query);
            url.searchParams.append('limit', 10);
            url.searchParams.append('contentRating[]', 'safe');
            url.searchParams.append('contentRating[]', 'suggestive');
            url.searchParams.append('contentRating[]', 'erotica');
            url.searchParams.append('contentRating[]', 'pornographic');
            return url;
        case 'namicomi':
            url.searchParams.append('title', query);
            url.searchParams.append('limit', 10);
            url.searchParams.append('contentRatings[]', 'safe');
            url.searchParams.append('contentRatings[]', 'mature');
            url.searchParams.append('contentRatings[]', 'restricted');
            return url;
    }
}

/**
 * Searches MangaDex for manga titles based on the provided query.
 *
 * This asynchronous function builds a URL using the provided query, makes a GET request
 * with a timeout of 5000ms, and processes the JSON response. If the request is successful and
 * data is found, it returns a Map where the keys are manga titles (extracted from the first key
 * in each title object) and the values are the corresponding manga IDs. If no results are found
 * or an error occurs during the fetch, it returns null.
 *
 * @param {string} query - The search query used to query MangaDex.
 * @returns {Promise<Map<string, string>|null>} A promise that resolves to a Map of titles paired with their respective IDs, or null if the search was unsuccessful or returned no data.
 */
const searchMangaDex = async (query) => {
    const url = buildURL(query, 'mangadex');
    try {
        const res = await fetch(url, {
            method: 'GET',
            timeout: 5000,
            headers: {
                'User-Agent': USER_AGENT,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.data?.length === 0) return null;

        const results = new Map(data.data.map((item) => [item.attributes.title[Object.keys(item.attributes.title)[0]], item.id]));
        return results;
    } catch {
        return null;
    };
};

/**
 * Searches NamiComi for titles based on the provided query.
 *
 * This asynchronous function constructs a URL using the provided query, makes a GET request
 * with a timeout of 5000ms, and processes the JSON response. If the request is successful and
 * data is found, it returns a Map where the keys are localized titles and the values are the
 * corresponding title IDs. If no results are found or an error occurs during the fetch, it
 * returns null.
 *
 * @async
 * @function searchNamiComi
 * @param {string} query - The search query used to query NamiComi.
 * @param {string} locale - The locale to use for the title.
 * @returns {Promise<Map<string, string>|null>} A promise that resolves to a Map of titles paired with their respective IDs, or null if the search was unsuccessful or returned no data.
 */
const searchNamiComi = async (query, locale) => {
    const url = buildURL(query, 'namicomi');
    try {
        const res = await fetch(url, {
            method: 'GET',
            timeout: 5000,
            headers: {
                'User-Agent': USER_AGENT,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.data?.length === 0) return null;

        const results = new Map(data.data.map((item) => {
            let localizedTitle = item.attributes.title[locale];
            if (!localizedTitle && locale === 'es') localizedTitle = item.attributes.title['es-419'];
            if (!localizedTitle) localizedTitle = item.attributes.title['en'];
            if (!localizedTitle) localizedTitle = item.attributes.title[Object.keys(item.attributes.title)[0]];
            return [localizedTitle, item.id];
        }));

        return results;
    } catch {
        return null;
    };
};

module.exports = search;