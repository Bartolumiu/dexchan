const { ActionRowBuilder, Colors, StringSelectMenuBuilder } = require("discord.js");
const { urlFormats } = require("../parsers/urlParser");
const truncateString = require("../tools/truncateString");

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

    let menuOptions = [];
    titles.forEach((id, title) => {
        menuOptions.push({
            label: truncateString(title, 100),
            value: id
        });
    });

    embed.setTitle(translations.embed.query.title)
        .setDescription(translations.embed.query.description)
        .setColor(Colors.Blurple)
        .addFields(fields);

    menu.addOptions(menuOptions);

    return new ActionRowBuilder().addComponents(menu);
}

const buildNamiComiTitleListEmbed = (embed, translations, titles) => {
    const fields = Array.from(titles, ([title, id]) => {
        return {
            name: truncateString(title, 256),
            value: `[${translations.embed.query.view}](${urlFormats.namicomi.primary.replace('{id}', id).replace('{title}', '')})`
        };
    }).filter(Boolean);

    const menu = new StringSelectMenuBuilder()
        .setCustomId('namicomi_select')
        .setPlaceholder(translations.menu.placeholder)
        .setMinValues(1)
        .setMaxValues(1);

    let menuOptions = [];
    titles.forEach((id, title) => {
        menuOptions.push({
            label: truncateString(title, 100),
            value: id
        });
    });

    embed.setTitle(translations.embed.query.title)
        .setDescription(translations.embed.query.description)
        .setColor(Colors.Blurple)
        .addFields(fields);

    menu.addOptions(menuOptions);

    return new ActionRowBuilder().addComponents(menu);
}

module.exports = buildTitleListEmbed;