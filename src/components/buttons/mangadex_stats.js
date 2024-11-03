const { Colors, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: {
        customId: /^mangadex_stats_/,
    },
    async execute(interaction, client) {
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;
        await interaction.deferUpdate();
        const customId = interaction.customId;

        const match = customId.match(/^mangadex_stats_(.+)$/);
        if (!match) return null; // This should never happen even if MangaDex changes their ID format (famous last words, I know)
        const title = match[1];

        const statsURL = `https://api.mangadex.org/statistics/manga/${title}`;
        const stats = await fetch(statsURL).then(async (res) => await res.json());

        // Check if the API returned an error
        if (stats.result === 'error') {
            const embed = new EmbedBuilder()
                .setTitle(await client.translate(locale, 'commands', 'manga.response.error.title'))
                .setDescription(await client.translate(locale, 'commands', 'manga.response.error.description.api', { statusCode: `${stats.errors[0].status} - ${stats.errors[0].title}` }))
                .setFooter({ text: await client.translate(locale, 'commands', 'manga.response.footer', { commandName: `/${interaction.message.interaction.commandName}`, user: interaction.user.username }), iconURL: client.user.avatarURL({ dynamic: true })})
                .setColor(Colors.Red);
            return interaction.followUp({ embeds: [embed], ephemeral: true });
        }

        // Format the statistics data
        const statsData = stats.statistics[title];
        const ratingData = statsData.rating;
        const distribution = ratingData.distribution;
        const distributionString = Object.entries(distribution).reverse().filter(([rating, count]) => count > 0).map(([rating, count]) => `${rating}/10: ${count}`).join('\n');
        const totalVotes = Object.values(distribution).reduce((total, count) => total + count, 0);
        const averageRating = ratingData.average.toFixed(2);
        const bayesianRating = ratingData.bayesian.toFixed(2);
        const follows = statsData.follows;


        // Create an embed with the statistics data
        const embed = new EmbedBuilder()
            .setTitle(await client.translate(locale, 'commands', 'manga.response.stats.title'))
            .setDescription(await client.translate(locale, 'commands', 'manga.response.stats.description', { mangaId: title }))
            .addFields(
                {   // Average rating
                    name: await client.translate(locale, 'commands', 'manga.response.stats.fields[0].name'),
                    value: `${averageRating}/10.00 (${totalVotes} ${await client.translate(locale, 'commands', 'manga.response.stats.units.votes')})`,
                    inline: true
                },
                {   // Bayesian rating
                    name: await client.translate(locale, 'commands', 'manga.response.stats.fields[1].name'),
                    value: `${bayesianRating}/10.00`,
                    inline: true
                },
                {   // Follows
                    name: await client.translate(locale, 'commands', 'manga.response.stats.fields[2].name'),
                    value: `${follows}`,
                    inline: true
                },
                {   // Rating distribution
                    name: await client.translate(locale, 'commands', 'manga.response.stats.fields[3].name'),
                    value: distributionString,
                    inline: true
                },
                {   // Comments
                    name: await client.translate(locale, 'commands', 'manga.response.stats.fields[4].name'),
                    value: `${statsData.comments.repliesCount}`,
                    inline: true
                }
            )
            .setColor(Colors.Blurple)
            .setFooter({
                text: await client.translate(locale, 'commands', 'manga.response.footer', { commandName: `/${interaction.message.interaction.commandName}`, user: interaction.user.username }),
                iconURL: client.user.avatarURL({ dynamic: true })
            });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(await client.translate(locale, 'commands', 'manga.response.stats.buttons.forum'))
                    .setURL(`https://forums.mangadex.org/threads/${statsData.comments.threadId}`)
                    .setStyle(ButtonStyle.Link)
            )

        // Send a follow-up message with the embed
        await interaction.followUp({ embeds: [embed], components: [buttons] });
    }
}