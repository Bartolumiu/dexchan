const { readdirSync, readFileSync } = require('fs');
const path = require('path');
const getChalk = require('../tools/getChalk');

// Language mapping for certain languages
const languageMap = {
    'en-GB': 'en',
    'en-US': 'en',
    'es-ES': 'es',
    'es-419': 'es'
};

const discordLocales = ['id', 'da', 'de', 'en-GB', 'en-US', 'es-ES', 'es-419', 'fr', 'hr', 'it', 'lt', 'hu', 'nl', 'no', 'pl', 'pt-BR', 'ro', 'fi', 'sv-SE', 'vi', 'tr', 'cs', 'el', 'bg', 'ru', 'uk', 'hi', 'th', 'zh-CN', 'ja', 'zh-TW', 'ko'];

const locales = {};
const commandDescriptions = {};

/**
 * Handles the loading and translation of locale files.
 * @param {*} client - The Discord client instance.
 */
module.exports = (client) => {
    /**
     * Handles the loading of locale files.
     * @returns {Promise<Object>} - A promise that resolves to the locales object containing all loaded translations.
     */
    client.handleLocales = async () => {
        await loadLocales(1);
        return locales;
    };

    /**
     * Translates a given key within a specified category for a given locale.
     * Falls back to English if the translation is not found.
     * @param {string} locale - The locale to translate to.
     * @param {string} category - The category of the translation (e.g., 'commands').
     * @param {string} key - The key of the translation within the category.
     * @param {Object} [replacements={}] - An object containing placeholder replacements.
     * @returns {string|null} - The translated string or null if not found.
     */
    client.translate = (locale, category, key, replacements = {}) => {
        return translate(locale, category, key, replacements) || translate('en', category, key, replacements);
    };

    /**
     * Get the user's preferred locale based on their profile or interaction.
     * 
     * @param {Object} userProfile - The user's profile containing their settings.
     * @param {Object} interaction - The interaction object from the Discord API.
     * @returns {string} - The preferred locale of the user or the interaction locale.
     */
    client.getLocale = (userProfile, interaction) => {
        return getLocale(userProfile, interaction);
    };
};

/**
 * Loads the locale files and populates the locales object.
 * @param {number} [log=0] - The log level (0 = no log, 1 = log loading).
 */
const loadLocales = async (log = 0) => {
    const chalk = await getChalk();
    if (log) console.log(chalk.blueBright('[Locale Handler] Loading locales...'));

    const localePath = path.join(__dirname, '../../i18n/locales');
    const localeFiles = readdirSync(localePath).filter(file => file.endsWith('.json'));
    if (log) console.log(chalk.blueBright(`[Locale Handler] Found ${localeFiles.length} locales.`));

    localeFiles.forEach(file => {
        const filePath = path.join(localePath, file);
        const localeName = path.basename(file, '.json');
        const localeData = JSON.parse(readFileSync(filePath, 'utf8'));

        locales[localeName] = localeData;

        if (localeData.commands) {
            commandDescriptions[localeName] = Object.fromEntries(
                Object.entries(localeData.commands).map(([command, commandData]) => [command, commandData.description])
            );
        }

        if (log) console.log(chalk.greenBright(`[Locale Handler] Locale ${localeName} loaded.`));
    });
}

/**
 * Translates a given key within a specified category for a given locale, with optional replacements.
 * Falls back to English if the translation is not found.
 * @param {string} locale - The locale to translate to.
 * @param {string} category - The category of the translation.
 * @param {string} key - The key of the translation, which can be nested.
 * @param {Object} [replacements={}] - An object containing placeholder replacements for the translation.
 * @returns {string|null} - The translated string with placeholders replaced, or null if translation is not found.
 */
const translate = (locale, category, key, replacements = {}) => {
    // Use mapped parent language if available
    locale = languageMap[locale] || locale;

    // Retrieve translations
    const localeTranslations = locales[locale];
    if (!localeTranslations) return null;

    const categoryTranslations = localeTranslations[category];
    if (!categoryTranslations) return null;

    // Retrieve the nested translation
    const translation = getNestedTranslation(categoryTranslations, key.split(/[.[/]/));
    if (!translation) return null;

    return Object.entries(replacements).reduce(
        (translatedText, [placeholder, value]) => translatedText.replace(new RegExp(`{${placeholder}}`, 'g'), value),
        translation
    );
};

/**
 * Retrieves a nested translation from a given set of translations.
 * @param {Object} translations - The translations object.
 * @param {string[]} nestedKeys - An array of keys representing the nested path.
 * @returns {string|null} - The nested translation or null if not found.
 */
const getNestedTranslation = (translations, nestedKeys) => {
    return nestedKeys.reduce((translation, key) => {
        if (!translation) return null;
        const trimmedKey = key.replace(/\]/g, '');
        return Array.isArray(translation) ? translation[parseInt(trimmedKey)] : translation[trimmedKey];
    }, translations);
};

/**
 * Translates a given attribute for a command into all available Discord locales.
 * 
 * @param {*} command - The command to translate.
 * @param {*} attribute - The attribute to translate for the command.
 * @returns {Promise<Object|null>} - An object containing the translations for each locale.
 */
const translateAttribute = async (command, attribute) => {
    await loadLocales();
    const translations = {};

    for (const locale of discordLocales) {
        const translation = translate(locale, 'commands', `${command}.${attribute}`);

        // If translation is available, add it to the map
        if (translation) {
            translations[locale] = translation;
        }
    }

    return translations;
}

/**
 * Get the user's preferred locale based on their profile or interaction.
 * 
 * @param {Object} userProfile - The user's profile containing their settings.
 * @param {Object} interaction - The interaction object from the Discord API.
 * @returns {string} - The preferred locale of the user or the interaction locale.
 */
const getLocale = (userProfile, interaction) => {
    return userProfile.preferredLocale || interaction.locale;
}

module.exports.getLocale = getLocale;
module.exports.translateAttribute = translateAttribute;