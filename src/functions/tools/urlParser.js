/**
 * @typedef {Object} RegexComponents
 * @property {Object} protocol - Regular expressions for URL protocols.
 * @property {string} protocol.http - Regular expression for HTTP protocol.
 * @property {string} protocol.https - Regular expression for HTTPS protocol.
 * @property {string} protocol.ftp - Regular expression for FTP protocol.
 * @property {string} protocol.ftps - Regular expression for FTPS protocol.
 * @property {string} protocol.ws - Regular expression for WebSocket protocol.
 * @property {string} protocol.wss - Regular expression for Secure WebSocket protocol.
 * 
 * @property {Object} namicomi - Components of regular expressions for NamiComi URLs.
 * @property {string} namicomi.primary - Matches the primary domain for NamiComi URLs.
 * @property {string} namicomi.secondary - Matches the secondary domain for NamiComi URLs.
 * @property {string} namicomi.locale - Matches locale codes in NamiComi URLs.
 * @property {string} namicomi.id - Matches the unique ID in NamiComi URLs.
 * @property {string} namicomi.slug - Matches the slug in NamiComi URLs.
 * 
 * @property {Object} mangadex - Components of regular expressions for MangaDex URLs.
 * @property {string} mangadex.subdomain - Matches optional subdomains in MangaDex URLs.
 * @property {string} mangadex.domain - Matches the main domain for MangaDex URLs.
 * @property {string} mangadex.id - Matches the unique UUID in MangaDex URLs.
 * @property {string} mangadex.slugAndParams - Matches optional slug and parameters in MangaDex URLs.
 */
const regexComponents = {
    protocol: {
        http: 'https?:\\/\\/',
        https: 'https?:\\/\\/',
        ftp: 'ftp:\\/\\/',
        ftps: 'ftps:\\/\\/',
        ws: 'ws:\\/\\/',
        wss: 'wss:\\/\\/'
    },
    namicomi: {
        primary: 'namicomi\\.com',
        secondary: 'nami\\.moe',
        locale: '[a-z]{2}(?:-[a-zA-Z]{2})?',
        id: '([a-zA-Z0-9]{8})',
        slug: '\\/[^\\/]+$',
    },
    mangadex: {
        subdomain: '(?:www\\.)?(?:canary|sandbox\\.)?',
        domain: 'mangadex\\.(?:org|dev)',
        id: '([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})',
        slugAndParams: '(?:\\/[^?]+)?(?:\\?.*)?'
    }
};

/**
 * @typedef {Object} RegexStrings
 * @property {string} mangadex - Complete regex for MangaDex URLs.
 * @property {Object} namicomi - Complete regex patterns for NamiComi URLs.
 * @property {string} namicomi.primary - Full regex pattern for primary NamiComi URL.
 * @property {string} namicomi.semi_shortened - Full regex pattern for semi-shortened NamiComi URL.
 * @property {string} namicomi.shortened - Full regex pattern for shortened NamiComi URL.
 */
const regexStrings = {
    mangadex: `^${regexComponents.protocol.https}${regexComponents.mangadex.subdomain}${regexComponents.mangadex.domain}\\/title\\/${regexComponents.mangadex.id}${regexComponents.mangadex.slugAndParams}$`,
    namicomi: {
        primary: `^${regexComponents.protocol.https}${regexComponents.namicomi.primary}\\/${regexComponents.namicomi.locale}\\/title\\/${regexComponents.namicomi.id}${regexComponents.namicomi.slug}$`,
        semi_shortened: `^${regexComponents.protocol.https}${regexComponents.namicomi.primary}\\/t\\/${regexComponents.namicomi.id}$`,
        shortened: `^${regexComponents.protocol.https}${regexComponents.namicomi.secondary}\\/t\\/${regexComponents.namicomi.id}$`
    }
};

/**
 * @typedef {Object} UrlRegexes
 * @property {RegExp} mangadex - Regular expression object for MangaDex URLs.
 * @property {Object} namicomi - Regular expression objects for NamiComi URL formats.
 * @property {RegExp} namicomi.primary - RegExp for primary NamiComi URL.
 * @property {RegExp} namicomi.semi_shortened - RegExp for semi-shortened NamiComi URL.
 * @property {RegExp} namicomi.shortened - RegExp for shortened NamiComi URL.
 */
const urlRegexes = {
    mangadex: new RegExp(regexStrings.mangadex),
    namicomi: {
        primary: new RegExp(regexStrings.namicomi.primary),
        semi_shortened: new RegExp(regexStrings.namicomi.semi_shortened),
        shortened: new RegExp(regexStrings.namicomi.shortened)
    }
};

/**
 * Parses a URL to extract the unique ID based on its type.
 * 
 * @async
 * @function parseURL
 * @param {string} url - The URL to parse.
 * @param {string} type - The type of URL (`"namicomi"` or `"mangadex"`).
 * @returns {Promise<string|null>} The extracted ID if matched, otherwise null.
 */
async function parseURL(url, type) {
    if (!url || typeof url !== 'string') return null;

    switch (type) {
        case 'namicomi':
            return parseNamiComiURL(url);
        case 'mangadex':
            return parseMangaDexURL(url);
        default:
            return null;
    }
};

/**
 * Parses a NamiComi URL to extract the unique ID.
 * 
 * @async
 * @function parseNamiComiURL
 * @param {string} url - The NamiComi URL to parse.
 * @returns {Promise<string|null>} The extracted ID if matched, otherwise null.
 */
async function parseNamiComiURL(url) {
    const primary = urlRegexes.namicomi.primary.exec(url);
    if (primary) return primary[1];
    const semiShortened = urlRegexes.namicomi.semi_shortened.exec(url);
    if (semiShortened) return semiShortened[1];
    const shortened = urlRegexes.namicomi.shortened.exec(url);
    return (shortened) ? shortened[1] : null;
};

/**
 * Parses a MangaDex URL to extract the unique ID, ignoring query parameters.
 * 
 * @async
 * @function parseMangaDexURL
 * @param {string} url - The MangaDex URL to parse.
 * @returns {Promise<string|null>} The extracted ID if matched, otherwise null.
 */
async function parseMangaDexURL(url) {
    url = url.split('?')[0].split('/').slice(0, 5).join('/');
    const match = urlRegexes.mangadex.exec(url);
    return (match) ? match[1] : null;
};

module.exports = { parseURL, parseNamiComiURL, parseMangaDexURL };