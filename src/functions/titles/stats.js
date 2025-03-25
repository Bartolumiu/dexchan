const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    mangadex: 'https://api.mangadex.org/statistics/manga/',
    namicomi: {
        ratings: 'https://api.namicomi.com/title/',
        stats: 'https://api.namicomi.com/statistics/title/'
    }
};

const getStats = async (id, type) => {
    switch (type) {
        case 'mangadex':
            return await getMangaDexStats(id);
        case 'namicomi':
            return await getNamiComiStats(id);
        default:
            throw new Error('Unsupported type');
    }
}

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
    } catch (err) {
        return null;
    };
};

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
    } catch (err) {
        return null;
    };
};

module.exports = getStats;