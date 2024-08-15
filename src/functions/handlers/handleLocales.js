const { readdirSync, readFileSync } = require('fs');
const path = require('path');

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

module.exports = (client) => {
    client.handleLocales = async () => {
        const chalk = (await import('chalk')).default;
        const localePath = path.join(__dirname, '../../locales');
        const localeFiles = readdirSync(localePath).filter(file => file.endsWith('.json'));

        localeFiles.forEach(file => {
            const filePath = path.join(localePath, file);
            const localeName = path.basename(file, '.json');
            const localeData = JSON.parse(readFileSync(filePath, 'utf8'));

            // Initialize locale data
            locales[localeName] = localeData;

            // Load command translations
            if (localeData.commands) {
                commandDescriptions[localeName] = Object.fromEntries(
                    Object.entries(localeData.commands).map(([command, commandData]) => [command, commandData.description])
);
            }

            console.log(chalk.greenBright(`[Locale Handler] Locale ${localeName} loaded.`));
        });
    };

    client.translate = (locale, category, key, replacements = {}) => {
        return translate(locale, category, key, replacements) || translate('en', category, key, replacements);
    };


    client.translateCommand = async (data, command, attribute) => {
        const chalk = (await import('chalk')).default;

        const translations = Object.fromEntries(
            discordLocales.map(locale => [locale, translate(locale, 'commands', `${command}.${attribute}`)]).filter(([, translation]) => translation)
        );

        try {
            if (attribute === 'name') {
                data.setNameLocalizations(translations);
            } else if (attribute === 'description') {
                data.setDescriptionLocalizations(translations);
            }
        } catch (e) {
            console.log(chalk.redBright(`[Command Handler] Error setting ${attribute} localizations for command ${command}`));
            console.error(e);
        }
    };

    const translateAttribute = async (command, attribute) => {
        const translations = {};

        discordLocales.forEach(locale => {
            const translation = translate(locale, 'commands', `${command}.${attribute}`);
            if (translation) translations[locale] = translation;
        })

        return translations;
    }
};

const translate = (locale, category, key, replacements = {} ) => {
    // Use mapped parent language if available
    locale = languageMap[locale] || locale;

    // Retrieve translations
    const localeTranslations = locales[locale];
    if (!localeTranslations) return null;

    const categoryTranslations = localeTranslations[category];
    if (!categoryTranslations) return null;

    // Retrieve the nested translation
    const translation = getNestedTranslation(categoryTranslations, key.split(/\.|\[/));
    if (!translation) return null;

    return Object.entries(replacements).reduce(
        (translatedText, [placeholder, value]) => translatedText.replace(new RegExp(`%${placeholder}%`, 'g'), value),
        translation
    );
};

const getNestedTranslation = (translations, nestedKeys) => {
    return nestedKeys.reduce((translation, key) => {
        if (!translation) return null;
        const trimmedKey = key.replace(']', '');
        return Array.isArray(translation) ? translation[parseInt(trimmedKey)] : translation[trimmedKey];
    }, translations);
};