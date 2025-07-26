const { EmbedBuilder, Colors } = require("discord.js");
const getTitleStats = require("../../functions/titles/titleStats");

module.exports = {
    data: {
        customId: /^namicomi_stats_/,
    },
    async execute(interaction, client) {
        await interaction.deferUpdate();
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;
        const customId = interaction.customId;
        const translations = {
            embed: {
                title: await client.translate(locale, 'commands', 'nami.response.stats.title'),
                description: await client.translate(locale, 'commands', 'nami.response.stats.description'),
                fields: {
                    rating: await client.translate(locale, 'commands', 'nami.response.stats.fields.rating.name'),
                    views: await client.translate(locale, 'commands', 'nami.response.stats.fields.views.name'),
                    follows: await client.translate(locale, 'commands', 'nami.response.stats.fields.follows.name'),
                    comments: await client.translate(locale, 'commands', 'nami.response.stats.fields.comments.name'),
                    chapterViews: await client.translate(locale, 'commands', 'nami.response.stats.fields.chapterViews.name'),
                    chapterComments: await client.translate(locale, 'commands', 'nami.response.stats.fields.chapterComments.name'),
                    chapterReactions: await client.translate(locale, 'commands', 'nami.response.stats.fields.chapterReactions.name')
                },
                units: {
                    votes: await client.translate(locale, 'commands', 'nami.response.stats.units.votes')
                },
                footer: await client.translate(locale, 'commands', 'nami.response.footer', { commandName: `/${interaction.message.interaction.commandName}`, user: interaction.user.username })
            }
        }

        const match = customId.match(/^namicomi_stats_(.+)$/);
        if (!match) return null; // This should never happen even if NamiComi changes their ID format (famous last words, I know)
        const title = match[1];

        const stats = await getTitleStats(title, 'namicomi');
        
        if (!stats) {
            const embed = new EmbedBuilder()
                .setTitle(translations.embed.title)
                .setDescription(translations.embed.description)
                .setFooter({ text: translations.embed.footer, iconURL: client.user.avatarURL({ dynamic: true }) })
                .setColor(Colors.Red);
            return interaction.followUp({ embeds: [embed], ephemeral: true });
        }

        // Create an embed with the rating and statistics data
        const embed = new EmbedBuilder()
            .setTitle(translations.embed.title)
            .setDescription(translations.embed.description.replace('{titleId}', title))
            .addFields(
                {
                    name: translations.embed.fields.rating,
                    value: `${stats.title.rating.bayesian.toFixed(2)}/5.00 (${stats.title.rating.count} ${translations.embed.units.votes})`,
                    inline: true
                },
                {
                    name: translations.embed.fields.views,
                    value: `${stats.title.views}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.follows,
                    value: `${stats.title.follows}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.comments,
                    value: `${stats.title.comments.repliesCount}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.chapterViews,
                    value: `${stats.chapters.views}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.chapterComments,
                    value: `${stats.chapters.comments}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.chapterReactions,
                    value: `${stats.chapters.reactions}`,
                    inline: true
                }
            )
            .setColor(Colors.Blurple)
            .setFooter({ text: translations.embed.footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

        // Send a follow-up message with the embed
        await interaction.followUp({ embeds: [embed] });
    }
}