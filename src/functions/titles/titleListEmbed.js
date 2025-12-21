const { ActionRowBuilder, Colors, EmbedBuilder, StringSelectMenuBuilder, ActionRow} = require("discord.js");
const { urlFormats } = require("../parsers/urlParser");
const truncateString = require("../tools/truncateString");

/**
 * Builds the title list embed.
 * @param {EmbedBuilder} embed - The embed object to build.
 * @param {Object} translations - Translations for the embed.
 * @param {Map<string, string>} titles - Map of titles and their IDs.
 * @param {string} type - The type of the embed.
 * @param {string} query - The search query.
 * @returns {ActionRowBuilder|null} The action row containing the select menu or null if type is unsupported.
 */
const buildTitleListEmbed = (embed, translations, titles, type, query) => {
    switch (type) {
        case 'mangabaka':
            return buildMangaBakaTitleListEmbed(embed, translations, titles, query);
        case 'mangadex':
            return buildMangaDexTitleListEmbed(embed, translations, titles, query);
        case 'namicomi':
            return buildNamiComiTitleListEmbed(embed, translations, titles, query);
        default:
            return null; // Unsupported type
    }
}

const buildSelectMenu = (source, translations, titles) => {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('search_select')
        .setPlaceholder(translations.response.menu.placeholder)
        .setMinValues(1)
        .setMaxValues(1);

    populateMenuOptions(menu, titles, source);
    return menu;
}

/**
 * Builds the title list for MangaBaka.
 * @param {EmbedBuilder} embed - The embed object to build.
 * @param {Object} translations - Translations for the embed.
 * @param {Map<string, string>} titles - Map of titles and their IDs.
 * @param {string} query - The search query.
 * @returns {ActionRowBuilder} The action row containing the select menu.
 */
const buildMangaBakaTitleListEmbed = (embed, translations, titles, query) => {
    const fields = Array.from(titles, ([title, id]) => {
        return {
            name: truncateString(title, 256),
            value: `[${translations.response.menu.view.replace('{source}', translations.options.source.values.mangabaka)}](${urlFormats.mangabaka.primary.replace('{id}', id).replace('{title}', '')})`
        };
    }).filter(Boolean);

    const menu = buildSelectMenu('mangabaka', translations, titles);

    buildEmbed(embed, translations, fields, { query: query, source: translations.options.source.values.mangabaka });
    return new ActionRowBuilder().addComponents(menu);
}

/**
 * Builds the title list embed for MangaDex.
 * @param {EmbedBuilder} embed - The embed object to build.
 * @param {Object} translations - Translations for the embed.
 * @param {Map<string, string>} titles - Map of titles and their IDs.
 * @param {string} query - The search query.
 * @returns {ActionRowBuilder} The action row containing the select menu.
 */
const buildMangaDexTitleListEmbed = (embed, translations, titles, query) => {
    const fields = Array.from(titles, ([title, id]) => {
        return {
            name: truncateString(title, 256),
            value: `[${translations.response.menu.view.replace('{source}', translations.options.source.values.mangadex)}](${urlFormats.mangadex.primary.replace('{id}', id).replace('{title}', '')})`
        };
    }).filter(Boolean);

    const menu = new StringSelectMenuBuilder()
        .setCustomId('mangadex_select')
        .setPlaceholder(translations.response.menu.placeholder)
        .setMinValues(1)
        .setMaxValues(1);

    populateMenuOptions(menu, titles);

    buildEmbed(embed, translations, fields, { query: query, source: translations.options.source.values.mangadex });
    return new ActionRowBuilder().addComponents(menu);
}

/**
 * Builds the title list embed for NamiComi.
 * @param {EmbedBuilder} embed - The embed object to build.
 * @param {Object} translations - Translations for the embed.
 * @param {Map<string, string>} titles - Map of titles and their IDs.
 * @param {string} query - The search query.
 * @returns {ActionRowBuilder} The action row containing the select menu.
 */
const buildNamiComiTitleListEmbed = (embed, translations, titles, query) => {
    const fields = Array.from(titles, ([title, id]) => {
        return {
            name: truncateString(title, 256),
            value: `[${translations.response.menu.view.replace('´{source}', translations.options.source.values.namicomi)}](${urlFormats.namicomi.shortened.replace('{id}', id)})`
        };
    }).filter(Boolean);

    const menu = new StringSelectMenuBuilder()
        .setCustomId('namicomi_select')
        .setPlaceholder(translations.response.menu.placeholder)
        .setMinValues(1)
        .setMaxValues(1);

    populateMenuOptions(menu, titles);

    buildEmbed(embed, translations, fields, { query: query, source: translations.options.source.values.namicomi });
    return new ActionRowBuilder().addComponents(menu);
}

/**
 * Populates the menu options for the title list embed.
 * @param {StringSelectMenuBuilder} menu Menu to populate
 * @param {Map<string, string>} titles Title list to create options from
 * @param {string} source Source of the titles
 * @returns {StringSelectMenuBuilder} The populated menu
 */
const populateMenuOptions = (menu, titles, source) => {
    let options = [];
    titles.forEach((id, title) => {
        options.push({
            label: truncateString(title, 100),
            value: `${source}:${id.toString()}`
        });
    });

    menu.addOptions(options);
    return menu;
};

/**
 * Builds the embed for the title list.
 * @param {EmbedBuilder} embed - The embed object to build.
 * @param {Object} translations - Translations for the embed.
 * @param {Array<Object<string, string>>} fields - Fields to add to the embed.
 */
const buildEmbed = (embed, translations, fields) => {
    embed.setTitle(translations.embed.query.title)
        .setDescription(translations.embed.query.description)
        .setColor(Colors.Blurple)
        .addFields(fields);
};

module.exports = buildTitleListEmbed;