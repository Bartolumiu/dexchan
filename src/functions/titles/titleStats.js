const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    mangadex: 'https://api.mangadex.org/statistics/manga/',
    namicomi: {
        ratings: 'https://api.namicomi.com/title/',
        stats: 'https://api.namicomi.com/statistics/title/'
    }
};

/**
 * Retrieves statistics for a title based on its ID and type.
 *
 * @param {(string|number)} id - The title ID to fetch statistics for.
 * @param {string} type - The source type to fetch statistics from. Accepted values are "mangadex" and "namicomi".
 * @returns {Promise<Object|null>} A promise that resolves with the title statistics, or null if an error occurs.
 * @throws {Error} If the provided type is not supported.
 */
const getTitleStats = async (id, type) => {
    switch (type) {
        case 'mangadex':
            return await getMangaDexStats(id);
        case 'namicomi':
            return await getNamiComiStats(id);
        default:
            throw new Error('Unsupported type');
    }
}

/**
 * Constructs a URL based on the provided title ID and type.
 *
 * @param {string} id - The title ID to be used in the URL.
 * @param {('mangadex'|'namicomi.ratings'|'namicomi.stats')} type - The type of URL to build.
 * @returns {URL} The constructed URL.
 */
const buildURL = (id, type) => {
    switch (type) {
        case 'mangadex':
            return new URL(`${URL_FORMATS.mangadex}${id}`);
        case 'namicomi.ratings':
            return new URL(`${URL_FORMATS.namicomi.ratings}${id}/rating`);
        case 'namicomi.stats':
            return new URL(`${URL_FORMATS.namicomi.stats}${id}`);
    }
}

/**
 * Fetches MangaDex statistics for a given title ID.
 *
 * Constructs the request URL using the provided ID and sends a GET request to the MangaDex API
 * with a specific timeout and headers. If the request is successful and returns a valid JSON response,
 * the function returns the statistics corresponding to the ID; otherwise, it returns null.
 *
 * @param {string} id - The title ID to fetch statistics for.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing the title statistics, or null if an error occurs or the response is not OK.
 */
const getMangaDexStats = async (id) => {
    const url = buildURL(id, 'mangadex');
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
        const data = await res.json();
        return data.statistics[id] || null;
    } catch {
        return null;
    };
};

/**
 * Fetches NamiComi statistics for a given title ID.
 *
 * This asynchronous function concurrently requests both the ratings and stats from the NamiComi API.
 * It returns an object that contains comment details, rating metrics, follows, and view count based on the retrieved data.
 * If either of the API responses is not successful or if any error occurs during the fetch, the function returns null.
 *
 * @async
 * @param {string|number} id - The title ID to fetch statistics for.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing the title statistics, or null if an error occurs or the API responses are not OK.
 */
const getNamiComiStats = async (id) => {
    const ratingsURL = buildURL(id, 'namicomi.ratings');
    const statsURL = buildURL(id, 'namicomi.stats');
    try {
        const [ratingsRes, statsRes] = await Promise.all([
            fetch(ratingsURL, {
                method: 'GET',
                timeout: 5000,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/json'
                }
            }),
            fetch(statsURL, {
                method: 'GET',
                timeout: 5000,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/json'
                }
            })
        ]);
        if (!ratingsRes.ok || !statsRes.ok) return null;
        const [ratingsData, statsData] = await Promise.all([
            ratingsRes.json(),
            statsRes.json()
        ]);
        return {
            comments: {
                threadId: null,
                repliesCount: statsData.data.attributes.commentCount,
            },
            rating: {
                average: 0,
                bayesian: ratingsData.data.attributes.rating,
                distribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            follows: statsData.data.attributes.followCount,
            views: statsData.data.attributes.viewCount
        };
    } catch {
        return null;
    };
};

module.exports = getTitleStats;