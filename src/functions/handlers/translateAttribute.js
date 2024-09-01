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
const commandDescriptions = {};

const localePath = path.join(__dirname, '../../locales');
const localeFiles = readdirSync(localePath).filter(file => file.endsWith('.json'));

localeFiles.forEach(file => {
    const filePath = path.join(localePath, file);
    const localeName = path.basename(file, '.json');
    const localeData = JSON.parse(readFileSync(filePath, 'utf8'));
    locales[localeName] = localeData;
})

const translateAttribute = async (command, attribute) => {
    const translations = {};

    for (const locale in locales) {
        const translation = await translate(locale, 'commands', `${command}.${attribute}`);
        if (translation) translations[locale] = translation;
    }

    return translations;
}

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

const getNestedTranslation = async (translations, nestedKeys) => {
    return nestedKeys.reduce((translation, key) => {
        if (!translation) return null;
        const trimmedKey = key.replace(']', '');
        return Array.isArray(translation) ? translation[parseInt(trimmedKey)] : translation[trimmedKey];
    }, translations);
}

module.exports = translateAttribute;