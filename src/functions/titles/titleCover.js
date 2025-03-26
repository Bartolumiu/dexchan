const getVersion = require('../tools/getVersion');

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu`;
const URL_FORMATS = {
    mangadex: 'https://mangadex.org/covers/',
    namicomi: 'https://uploads.namicomi.com/covers/'
}

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

const buildURL = (title, type, locale = null) => {
    switch (type) {
        case 'mangadex': {
            const id = title.id;
            const coverName = title.relationships.find(rel => rel.type === 'cover_art').attributes.fileName;
            return new URL(`${URL_FORMATS.mangadex}${id}/${coverName}.512.jpg`);
        }
        case 'namicomi': {
            const id = title.id;
            let coverName = title.relationships.find(rel => rel.type === 'cover_art' && rel.attributes.locale === locale).attributes.fileName;
            if (!coverName && title.relationships.find(rel => rel.type === 'cover_art').length > 0) coverName = title.relationships.find(rel => rel.type === 'cover_art')[0].attributes.fileName;
            if (!coverName) return null;
            return new URL(`${URL_FORMATS.namicomi}${id}/${coverName}.512.jpg`);
        }
    }
}

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