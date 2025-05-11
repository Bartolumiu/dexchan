/**
 * Map of locale codes to fallback language codes.
 * @type {Object.<string, string>}
 */
const languageMap = {
    'en-US': 'en',
    'en-GB': 'en',
    'es-ES': 'es',
    'es-419': 'es'
}

/**
 * Retrieves a localized description for the given title based on its type and locale.
 *
 * This function normalizes the provided locale using a language map and then delegates
 * the retrieval to the appropriate helper function depending on the title source type.
 *
 * @param {Object} title - The title object containing attributes.
 * @param {Object} title.attributes - An object containing title attributes.
 * @param {Object.<string, string>} title.attributes.description - Descriptions mapped by locale codes.
 * @param {string} type - The source type of the title ('mangadex' or 'namicomi').
 * @param {string} locale - The locale code (e.g., 'en-US', 'es-ES').
 * @returns {string|null} The localized description if available; otherwise, null.
 */
const getLocalizedDescription = (title, type, locale) => {
    locale = languageMap[locale] || locale;

    switch (type) {
        case 'mangadex':
            return getMangaDexDescription(title, locale);
        case 'namicomi':
            return getNamiComiDescription(title, locale);
    }
}

/**
 * Retrieves the MangaDex description for the given title and locale.
 *
 * The function attempts to get the description using the provided locale.
 * If not found and the locale is 'es', it falls back to 'es-la'.
 * Finally, if still unavailable, the English ('en') description is used.
 *
 * @param {Object} title - The title object containing attributes.
 * @param {Object} title.attributes - An object containing title attributes.
 * @param {Object.<string, string>} title.attributes.description - Descriptions mapped by locale codes.
 * @param {string} locale - The locale code after normalization.
 * @returns {string|null} The localized description if found; otherwise, null.
 */
const getMangaDexDescription = (title, locale) => {
    let description = title.attributes.description[locale];
    if (!description && locale === 'es') description = title.attributes.description['es-la'];
    if (!description) description = title.attributes.description['en'];

    return description || null;
};

/**
 * Retrieves the NamiComi description for the given title and locale.
 *
 * This function attempts to retrieve the description using the provided locale.
 * If it is not found and the locale is 'es', a fallback to 'es-419' is used.
 * If still undefined, it uses the English ('en') description as a last resort.
 *
 * @param {Object} title - The title object containing attributes.
 * @param {Object} title.attributes - An object containing title attributes.
 * @param {Object.<string, string>} title.attributes.description - Descriptions mapped by locale codes.
 * @param {string} locale - The locale code after normalization.
 * @returns {string|null} The localized description if available; otherwise, null.
 */
const getNamiComiDescription = (title, locale) => {
    if (locale === 'es') locale = 'es-es'; // NamiComi uses 'es-es' for Spanish (I got scammed by this, and I'm not happy about it, hmph >:( )
    let description = title.attributes.description[locale];
    if (!description && locale === 'es-es') description = title.attributes.description['es-419'];
    if (!description) description = title.attributes.description['en'];

    return description || null;
};

module.exports = getLocalizedDescription;