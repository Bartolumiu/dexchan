const { EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { MessageFlags } = require("discord-api-types/v10");
const { getLocale } = require("../../functions/handlers/handleLocales");
const getTitleStats = require("../../functions/titles/titleStats");

module.exports = {
    data: {
        customId: /_title_stats_/,
    },
    async execute(interaction, client) {
        await interaction.deferUpdate();
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = getLocale(userSettings, interaction);

        // Inject source name translations to strings object
        const translations = {
            ...(client.getTranslations(locale, 'components', 'title_stats')),
            sources: client.getTranslations(locale, 'generic', 'sources')
        };

        const customId = interaction.customId;
        const match = customId.match(/^(.+)_title_stats_(.+)$/);
        if (!match) return null; // This should never happen even if any of the sources change their ID format (famous last words, I know)
        const source = match[1];
        const entryId = match[2];

        const stats = await getTitleStats(entryId, source);

        if (!stats) {
            const embed = new EmbedBuilder()
                .setTitle(translations.error.title)
                .setDescription(translations.error.description)
                .setFooter({ text: translations.response.footer.replace('{user}', interaction.user.username), iconURL: client.user.avatarURL({ dynamic: true }) })
                .setColor(Colors.Red);
            return interaction.followUp({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        const embed = new EmbedBuilder()
            .setTitle(translations.response.title)
            .setDescription(translations.response.description.replace('{titleId}', entryId).replace('{source}', source))
            .addFields(buildEmbedFields(stats, translations, source))
            .setFooter({ text: translations.response.footer.replace('{user}', interaction.user.username), iconURL: client.user.avatarURL({ dynamic: true }) })
            .setColor(Colors.Blurple);

        const buttons = buildButtons(stats, translations, source);

        await interaction.followUp({ embeds: [embed], components: (buttons) ? [buttons] : null });
    }
}

const buildEmbedFields = (stats, translations, type) => {
    switch (type) {
        case 'mangadex':
            return buildMangaDexEmbedFields(stats, translations);
        case 'namicomi':
            return buildNamiComiEmbedFields(stats, translations);
        // No need for a default case since the type is already validated in getTitleStats
    }
}

const buildMangaDexEmbedFields = (stats, translations) => {
    return [
        { name: translations.response.fields.average.name, value: `${stats.title.rating.average}/10.00 (${stats.title.rating.count} ${translations.response.units.votes})`, inline: true },
        { name: translations.response.fields.bayesian.name, value: `${stats.title.rating.bayesian}/10.00`, inline: true },
        { name: translations.response.fields.follows.name, value: `${stats.title.follows}`, inline: true },
        { name: translations.response.fields.distribution.name, value: Object.entries(stats.title.rating.distribution).reverse().filter(([, count]) => count > 0).map(([rating, count]) => `${rating}/10: \`${count}\` · (${(count / stats.title.rating.count * 100).toFixed(2)}%)`).join('\n') || 'N/A' },
        { name: translations.response.fields.comments.name, value: `${stats.title.comments.repliesCount}`, inline: true }
    ];
}

const buildNamiComiEmbedFields = (stats, translations) => {
    return [
        { name: translations.response.fields.rating.name, value: `${stats.title.rating.bayesian}/5.00 (${stats.title.rating.count} ${translations.response.units.votes})`, inline: true },
        { name: translations.response.fields.views.name, value: `${stats.title.views}`, inline: true },
        { name: translations.response.fields.follows.name, value: `${stats.title.follows}`, inline: true },
        { name: translations.response.fields.comments.name, value: `${stats.title.comments.repliesCount}`, inline: true },
        { name: translations.response.fields.chapter_views.name, value: `${stats.chapters.views}`, inline: true },
        { name: translations.response.fields.chapter_comments.name, value: `${stats.chapters.comments}`, inline: true },
        { name: translations.response.fields.chapter_reactions.name, value: `${stats.chapters.reactions}`, inline: true }
    ];
}

const buildButtons = (stats, translations, type) => {
    switch (type) {
        case 'mangadex':
            return buildMangaDexButtons(stats, translations);
        case 'namicomi':
            return buildNamiComiButtons(stats, translations);
        // No need for a default case since the type is already validated in getTitleStats
    }
}

const buildMangaDexButtons = (stats, translations) => {
    const buttons = new ActionRowBuilder();
    if (stats.title.comments.threadId) {
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel(translations.response.buttons.mangadex.forum.open)
                .setURL(`https://forums.mangadex.org/threads/${stats.title.comments.threadId}`)
                .setStyle(ButtonStyle.Link)
        )
    } else {
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel(translations.response.buttons.mangadex.forum.no_thread)
                .setURL('https://forums.mangadex.org/')
                .setStyle(ButtonStyle.Link)
                .setDisabled(true)
        )
    }
    return buttons;
}

const buildNamiComiButtons = (stats, translations) => {
    // Return an null for now since I can't reliably build any buttons for the comment section.
    // Current URL format: https://namicomi.com/{locale}/title/{titleId}/{slug}/comments
    return null;
}