const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    data: {
        customId: /^nami_stats_/,
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

        const match = customId.match(/^nami_stats_(.+)$/);
        if (!match) return null; // This should never happen even if NamiComi changes their ID format (famous last words, I know)
        const title = match[1];

        const ratingURL = `https://api.namicomi.com/title/${title}/rating`;
        const statsURL = `https://api.namicomi.com/statistics/title/${title}`;

        // Get both the rating and statistics of the title
        const [rating, stats] = await Promise.all([
            fetch(ratingURL).then(async (res) => await res.json()),
            fetch(statsURL).then(async (res) => await res.json())
        ]);

        // Check if the API returned an error
        if (rating.result === 'error' || stats.result === 'error') {
            return interaction.editReply({ content: 'An error occurred while fetching the data.', ephemeral: true });
        }

        // Format the rating and statistics data
        const ratingData = rating.data.attributes;
        const statsData = stats.data.attributes;
        const chapterViewCounts = Object.values(statsData.extra.totalChapterViews).reduce((total, count) => total + count, 0);
        const chapterCommentCounts = Object.values(statsData.extra.totalChapterComments).reduce((total, count) => total + count, 0);
        const chapterReactionCounts = Object.values(statsData.extra.totalChapterReactions).reduce((total, count) => total + count, 0);

        // Create an embed with the rating and statistics data
        const embed = new EmbedBuilder()
            .setTitle(translations.embed.title)
            .setDescription(translations.embed.description.replace('{titleId}', title))
            .addFields(
                {
                    name: translations.embed.fields.rating,
                    value: `${ratingData.rating.toFixed(2)}/5.00 (${ratingData.count} ${translations.embed.units.votes})`,
                    inline: true
                },
                {
                    name: translations.embed.fields.views,
                    value: `${statsData.viewCount}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.follows,
                    value: `${statsData.followCount}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.comments,
                    value: `${statsData.commentCount}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.chapterViews,
                    value: `${chapterViewCounts}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.chapterComments,
                    value: `${chapterCommentCounts}`,
                    inline: true
                },
                {
                    name: translations.embed.fields.chapterReactions,
                    value: `${chapterReactionCounts}`,
                    inline: true
                }
            )
            .setColor(Colors.Blurple)
            .setFooter({ text: translations.embed.footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

        // Send a follow-up message with the embed
        await interaction.followUp({ embeds: [embed] });
    }
}