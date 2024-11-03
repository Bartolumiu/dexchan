const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    data: {
        customId: /^nami_stats_/,
    },
    async execute(interaction, client) {
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;
        await interaction.deferUpdate();
        const customId = interaction.customId;

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
            .setTitle(client.translate(locale, 'commands', 'nami.response.stats.title'))
            .setDescription(client.translate(locale, 'commands', 'nami.response.stats.description', { titleId: title }))
            .addFields(
                {
                    name: await client.translate(locale, 'commands', 'nami.response.stats.fields[0].name'),
                    value: `${ratingData.rating.toFixed(2)}/5.00 (${ratingData.count} ${client.translate(locale, 'commands', 'nami.response.stats.units.votes')})`,
                    inline: true
                },
                {
                    name: await client.translate(locale, 'commands', 'nami.response.stats.fields[1].name'),
                    value: `${statsData.viewCount}`,
                    inline: true
                },
                {
                    name: await client.translate(locale, 'commands', 'nami.response.stats.fields[2].name'),
                    value: `${statsData.followCount}`,
                    inline: true
                },
                {
                    name: await client.translate(locale, 'commands', 'nami.response.stats.fields[3].name'),
                    value: `${statsData.commentCount}`,
                    inline: true
                },
                {
                    name: await client.translate(locale, 'commands', 'nami.response.stats.fields[4].name'),
                    value: `${chapterViewCounts}`,
                    inline: true
                },
                {
                    name: await client.translate(locale, 'commands', 'nami.response.stats.fields[5].name'),
                    value: `${chapterCommentCounts}`,
                    inline: true
                },
                {
                    name: await client.translate(locale, 'commands', 'nami.response.stats.fields[6].name'),
                    value: `${chapterReactionCounts}`,
                    inline: true
                }
            )
            .setColor(Colors.Blurple)
            .setFooter({
                text: await client.translate(locale, 'commands', 'nami.response.footer', { commandName: `/${interaction.message.interaction.commandName}`, user: interaction.user.username }),
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            });

        // Send a follow-up message with the embed
        await interaction.followUp({ embeds: [embed] });
    }
}