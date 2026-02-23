const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    mangabaka: 'https://api.mangabaka.dev/v1/statistics/series/',
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
 * @returns {Promise<Object|null>} A promise that resolves with the title statistics, or null if an error occurs or the type is unsupported.
 */
const getTitleStats = async (id, type) => {
    switch (type) {
        case 'mangabaka':
            return await getMangaBakaStats(id);
        case 'mangadex':
            return await getMangaDexStats(id);
        case 'namicomi':
            return await getNamiComiStats(id);
        default:
            return null; // Unsupported type
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
        case 'mangabaka':
            return new URL(`${URL_FORMATS.mangabaka}${id}`);
        case 'mangadex':
            return new URL(`${URL_FORMATS.mangadex}${id}`);
        case 'namicomi.ratings':
            return new URL(`${URL_FORMATS.namicomi.ratings}${id}/rating`);
        case 'namicomi.stats':
            return new URL(`${URL_FORMATS.namicomi.stats}${id}`);
    }
}

const getMangaBakaStats = async (id) => {
    const url = buildURL(id, 'mangabaka');
    // MangaBaka does not provide statistics via their API as of now
    // Return null to avoid breaking the bot (there's no "stats" button for MangaBaka entries anyway)
    // Jippi plz add stats endpoint ;_;
    return null;
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
        return formatStats(data, null, 'mangadex');
    } catch {
        return null;
    }
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
        return formatStats(statsData, ratingsData, 'namicomi');
    } catch {
        return null;
    }
};

const formatStats = (stats, ratings, type) => {
    switch (type) {
        case 'mangadex':
            return formatMangaDexStats(stats);
        case 'namicomi':
            return formatNamiComiStats(stats, ratings);
        // No need for a default case since the type is already validated in getTitleStats
    }
}

const formatMangaDexStats = (stats) => {
    return {
        title: {
            comments: {
                threadId: stats.comments?.id || null,
                repliesCount: stats.comments?.repliesCount || 0,
            },
            rating: {
                average: stats.rating?.average || 0.00,
                bayesian: stats.rating?.bayesian || 0.00,
                distribution: stats.rating?.distribution || {},
                count: Object.values(stats.rating?.distribution || {}).reduce((total, count) => total + count, 0) || 0
            },
            follows: stats.follows || 0,
            views: 0
        },
        chapters: {
            views: 0,
            comments: 0,
            reactions: 0
        }
    };
}

const formatNamiComiStats = (stats, ratings) => {
    return {
        title: {
            comments: {
                threadId: null,
                repliesCount: stats.data.attributes.commentCount || 0,
            },
            rating: {
                average: 0,
                bayesian: ratings.data.attributes.rating || 0,
                distribution: {
                    '1': 0,
                    '2': 0,
                    '3': 0,
                    '4': 0,
                    '5': 0,
                    '6': 0,
                    '7': 0,
                    '8': 0,
                    '9': 0,
                    '10': 0
                },
                count: ratings.data.attributes.count || 0
            },
            follows: stats.data.attributes.followCount || 0,
            views: stats.data.attributes.viewCount || 0
        },
        chapters: {
            views: Object.values(stats.data.attributes.extra.totalChapterViews).reduce((total, count) => total + count, 0) || 0,
            comments: Object.values(stats.data.attributes.extra.totalChapterComments).reduce((total, count) => total + count, 0) || 0,
            reactions: Object.values(stats.data.attributes.extra.totalChapterReactions).reduce((total, count) => total + count, 0) || 0
        }
    };
}

module.exports = getTitleStats;