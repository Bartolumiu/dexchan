const { ActionRowBuilder, Colors, StringSelectMenuBuilder } = require("discord.js");
const { urlFormats } = require("../parsers/urlParser");
const truncateString = require("../tools/truncateString");
const { EmbedBuilder } = require("discord.js");

const buildTitleListEmbed = (embed, translations, titles, type) => {
    switch (type) {
        case 'mangadex':
            return buildMangaDexTitleListEmbed(embed, translations, titles);
        case 'namicomi':
            return buildNamiComiTitleListEmbed(embed, translations, titles);
        default:
            throw new Error('Unsupported type');
    }
}

/**
 * Builds the title list embed for MangaDex.
 * @param {EmbedBuilder} embed - The embed object to build.
 * @param {Object} translations - Translations for the embed.
 * @param {Map<string, string>} titles - Map of titles and their IDs.
 * @returns {ActionRowBuilder} The action row containing the select menu.
 */
const buildMangaDexTitleListEmbed = (embed, translations, titles) => {
    const fields = Array.from(titles, ([title, id]) => {
        return {
            name: truncateString(title, 256),
            value: `[${translations.embed.query.view}](${urlFormats.mangadex.primary.replace('{id}', id).replace('{title}', '')})`
        };
    }).filter(Boolean);

    const menu = new StringSelectMenuBuilder()
        .setCustomId('mangadex_select')
        .setPlaceholder(translations.menu.placeholder)
        .setMinValues(1)
        .setMaxValues(1);

    populateMenuOptions(menu, titles);

    buildEmbed(embed, translations, fields);
    return new ActionRowBuilder().addComponents(menu);
}

/**
 * Builds the title list embed for NamiComi.
 * @param {EmbedBuilder} embed - The embed object to build.
 * @param {Object} translations - Translations for the embed.
 * @param {Map<string, string>} titles - Map of titles and their IDs.
 * @returns {ActionRowBuilder} The action row containing the select menu.
 */
const buildNamiComiTitleListEmbed = (embed, translations, titles) => {
    const fields = Array.from(titles, ([title, id]) => {
        return {
            name: truncateString(title, 256),
            value: `[${translations.embed.query.view}](${urlFormats.namicomi.shortened.replace('{id}', id)})`
        };
    }).filter(Boolean);

    const menu = new StringSelectMenuBuilder()
        .setCustomId('namicomi_select')
        .setPlaceholder(translations.menu.placeholder)
        .setMinValues(1)
        .setMaxValues(1);

    populateMenuOptions(menu, titles);

    buildEmbed(embed, translations, fields);
    return new ActionRowBuilder().addComponents(menu);
}

/**
 * Populates the menu options for the title list embed.
 * @param {StringSelectMenuBuilder} menu Menu to populate
 * @param {Map<string, string>} titles Title list to create options from
 * @returns {StringSelectMenuBuilder} The populated menu
 */
const populateMenuOptions = (menu, titles) => {
    let options = [];
    titles.forEach((id, title) => {
        options.push({
            label: truncateString(title, 100),
            value: id
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