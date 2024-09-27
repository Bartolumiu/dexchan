const { readdirSync, readFileSync } = require('fs');
const path = require('path');

const languageMap = {
    'en-GB': 'en',
    'en-US': 'en',
    'es-ES': 'es',
    'es-419': 'es'
}

const discordLocales = ['id', 'da', 'de', 'en-GB', 'en-US', 'es-ES', 'es-419', 'fr', 'hr', 'it', 'lt', 'hu', 'nl', 'no', 'pl', 'pt-BR', 'ro', 'fi', 'sv-SE', 'vi', 'tr', 'cs', 'el', 'bg', 'ru', 'uk', 'hi', 'th', 'zh-CN', 'ja', 'zh-TW', 'ko'];

const locales = {};
const localePath = path.join(__dirname, '../../locales');
const localeFiles = readdirSync(localePath).filter(file => file.endsWith('.json'));

localeFiles.forEach(file => {
    const filePath = path.join(localePath, file);
    const localeName = path.basename(file, '.json');
    const localeData = JSON.parse(readFileSync(filePath, 'utf8'));
    locales[localeName] = localeData;
})


/**
 * Translates a given attribute of a command into multiple locales.
 *
 * @param {string} command - The command to translate.
 * @param {string} attribute - The attribute of the command to translate.
 * @returns {Promise<Object>} A promise that resolves to an object containing translations for each locale.
 */
const translateAttribute = async (command, attribute) => {
    const translations = {};

    for (const locale in discordLocales) {
        const translation = await translate(discordLocales[locale], 'commands', `${command}.${attribute}`);
        
        // If translation is available, add it to the map
        if (translation) {
            translations[discordLocales[locale]] = translation;
        }
    }

    return translations;
}


/**
 * Translates a given key within a specified category for a given locale, with optional replacements.
 *
 * @param {string} locale - The locale to translate to. If a mapped parent language is available, it will be used.
 * @param {string} category - The category of the translation.
 * @param {string} key - The key of the translation, which can be nested.
 * @param {Object} [replacements={}] - An object containing placeholder replacements for the translation.
 * @returns {Promise<string|null>} - The translated string with placeholders replaced, or null if translation is not found.
 */
const translate = async (locale, category, key, replacements = {} ) => {
    // Use mapped parent language if available
    locale = languageMap[locale] || locale;

    // Retrieve translations
    const localeTranslations = locales[locale];
    if (!localeTranslations) return null;

    const categoryTranslations = localeTranslations[category];
    if (!categoryTranslations) return null;

    // Retrieve the nested translation
    const translation = await getNestedTranslation(categoryTranslations, key.split(/\.|\[/));
    if (!translation) return null;

    // Replace placeholders
    return Object.entries(replacements).reduce(
        (translated, [key, value]) => translated.replace(new RegExp(`{${key}}`, 'g'), value),
        translation
    );
};


/**
 * Retrieves a nested translation value from a translations object based on an array of nested keys.
 *
 * @param {Object|Array} translations - The translations object or array to search within.
 * @param {string[]} nestedKeys - An array of keys representing the path to the nested translation.
 * @returns {Promise<*>} - The nested translation value, or null if not found.
 */
const getNestedTranslation = async (translations, nestedKeys) => {
    return nestedKeys.reduce((translation, key) => {
        if (!translation) return null;
        const trimmedKey = key.replace(']', '');
        return Array.isArray(translation) ? translation[parseInt(trimmedKey)] : translation[trimmedKey];
    }, translations);
}

module.exports = translateAttribute;