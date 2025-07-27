/**
 * Map of locale codes to fallback language codes.
 * @type {Object.<string, string>}
 */
const languageMap = {
    'en-US': 'en',
    'en-GB': 'en',
    'es-ES': 'es',
    'es-419': 'es'
};

/**
 * Returns a localized title based on the provided title object, type, and locale.
 *
 * This function maps certain locale codes (e.g., "en-US", "en-GB", "es-ES", "es-419") to simplified language identifiers.
 * Depending on the given type, it delegates the retrieval of the localized title to
 * either getMangaDexTitle (for "mangadex") or getNamiComiTitle (for "namicomi").
 *
 * @param {Object} title - The title object containing language-specific title attributes.
 * @param {string} type - The type of title source ("mangadex" or "namicomi").
 * @param {string} locale - The requested locale code.
 * @returns {string|null} The localized title if found, or null if not found or the type is unsupported.
 */
const getLocalizedTitle = (title, type, locale) => {
    locale = languageMap[locale] || locale;

    switch (type) {
        case 'mangadex':
            return getMangaDexTitle(title, locale);
        case 'namicomi':
            return getNamiComiTitle(title, locale);
        default:
            return null; // Unsupported type
    }
};

/**
 * Returns a localized title for MangaDex.
 *
 * It retrieves the first available title from the title attributes since the locale parameter is not directly used.
 *
 * @param {Object} title - The MangaDex title object containing a "title" attribute with language keys.
 * @param {string} locale - The locale code, provided for consistency (currently not used in selection).
 * @returns {string|null} The localized title for MangaDex if available; otherwise, null.
 */
const getMangaDexTitle = (title, locale) => {
    return title.attributes.title[Object.keys(title?.attributes.title)[0]] || null;
};

/**
 * Returns a localized title for NamiComi.
 *
 * The function attempts to retrieve the title matching the provided locale. If the title is not found for the given locale,
 * it uses the following fallback order:
 *   1. If locale is "es", tries "es-419".
 *   2. Tries "en".
 *   3. Retrieves the first available title entry.
 *
 * @param {Object} title - The NamiComi title object containing a "title" attribute with locale-specific keys.
 * @param {string} locale - The locale code used to fetch the localized title.
 * @returns {string|null} The localized NamiComi title if found; otherwise, null.
 */
const getNamiComiTitle = (title, locale) => {
    if (locale === 'es') locale = 'es-es'; // NamiComi uses "es-es" for Spanish (I got scammed by this, and I'm not happy about it, hmph >:( )
    let localizedTitle = title.attributes.title[locale];
    if (!localizedTitle && locale === 'es-es') localizedTitle = title.attributes.title['es-419'];
    if (!localizedTitle) localizedTitle = title.attributes.title['en'];
    if (!localizedTitle) localizedTitle = title.attributes.title[Object.keys(title?.attributes.title)[0]];
    return localizedTitle || null;
};

module.exports = getLocalizedTitle;