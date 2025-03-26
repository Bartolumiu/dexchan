const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    namicomi: 'https://uploads.namicomi.com/media/manga/'
}

const getBanner = async (title, type) => {
    switch (type) {
        case 'namicomi':
            return await getNamiComiBanner(title);
        default:
            throw new Error('Unsupported type');
    }
}

const buildURL = (title, type) => {
    switch (type) {
        case 'namicomi': {
            const id = title.id;
            const fileName = title.attributes?.bannerFileName;
            if (!fileName) return null;
            return new URL(`${URL_FORMATS.namicomi}${id}/banner/${fileName}`);
        }
    };
};

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
    } catch (err) {
        return null;
    };
};

module.exports = getBanner;