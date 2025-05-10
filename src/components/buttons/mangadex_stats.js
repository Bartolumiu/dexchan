const { Colors, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: {
        customId: /^mangadex_stats_/,
    },
    async execute(interaction, client) {
        await interaction.deferUpdate();
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;
        const customId = interaction.customId;
        const translations = {
            embed: {
                title: await client.translate(locale, 'commands', 'manga.response.stats.title'),
                description: await client.translate(locale, 'commands', 'manga.response.stats.description'),
                fields: {
                    average: await client.translate(locale, 'commands', 'manga.response.stats.fields.average.name'),
                    bayesian: await client.translate(locale, 'commands', 'manga.response.stats.fields.bayesian.name'),
                    follows: await client.translate(locale, 'commands', 'manga.response.stats.fields.follows.name'),
                    distribution: await client.translate(locale, 'commands', 'manga.response.stats.fields.distribution.name'),
                    comments: await client.translate(locale, 'commands', 'manga.response.stats.fields.comments.name')
                },
                units: {
                    votes: await client.translate(locale, 'commands', 'manga.response.stats.units.votes')
                },
                footer: await client.translate(locale, 'commands', 'manga.response.footer', { commandName: `/${interaction.message.interaction.commandName}`, user: interaction.user.username })
            },
            error: {
                title: await client.translate(locale, 'commands', 'manga.response.error.title'),
                description: await client.translate(locale, 'commands', 'manga.response.error.description.api')
            },
            buttons: {
                forum: {
                    open: await client.translate(locale, 'commands', 'manga.response.stats.buttons.forum.open'),
                    no_thread: await client.translate(locale, 'commands', 'manga.response.stats.buttons.forum.no_thread')
                }
            }
        }

        const match = customId.match(/^mangadex_stats_(.+)$/);
        if (!match) return null; // This should never happen even if MangaDex changes their ID format (famous last words, I know)
        const title = match[1];

        const statsURL = `https://api.mangadex.org/statistics/manga/${title}`;
        const stats = await fetch(statsURL).then(async (res) => await res.json());

        // Check if the API returned an error
        if (stats.result === 'error') {
            const embed = new EmbedBuilder()
                .setTitle(translations.error.title)
                .setDescription(translations.error.description)
                .setFooter({ text: translations.embed.footer, iconURL: client.user.avatarURL({ dynamic: true })})
                .setColor(Colors.Red);
            return interaction.followUp({ embeds: [embed], ephemeral: true });
        }

        // Format the statistics data
        const statsData = stats.statistics[title] || {};
        const ratingData = statsData.rating || {};
        const distribution = ratingData.distribution || {};
        const distributionString = Object.entries(distribution).reverse().filter(([rating, count]) => count > 0).map(([rating, count]) => `${rating}/10: ${count}`).join('\n') || 'N/A';
        const totalVotes = Object.values(distribution).reduce((total, count) => total + count, 0) || 0;
        const averageRating = ratingData.average?.toFixed(2) || 0.00;
        const bayesianRating = ratingData.bayesian?.toFixed(2) || 0.00;
        const follows = statsData.follows || 0;


        // Create an embed with the statistics data
        const embed = new EmbedBuilder()
            .setTitle(translations.embed.title)
            .setDescription(translations.embed.description.replace('{mangaId}', title))
            .addFields(
                { name: translations.embed.fields.average, value: `${averageRating}/10.00 (${totalVotes} ${translations.embed.units.votes})`, inline: true },
                { name: translations.embed.fields.bayesian, value: `${bayesianRating}/10.00`, inline: true },
                { name: translations.embed.fields.follows, value: `${follows}`, inline: true },
                { name: translations.embed.fields.distribution, value: distributionString, inline: true },
                { name: translations.embed.fields.comments, value: `${statsData.comments?.repliesCount || 0}`, inline: true }
            )
            .setColor(Colors.Blurple)
            .setFooter({ text: translations.embed.footer, iconURL: client.user.avatarURL({ dynamic: true }) });

            const buttons = new ActionRowBuilder();
            if (statsData.comments?.threadId) {
                buttons.addComponents(
                    new ButtonBuilder()
                        .setLabel(translations.buttons.forum.open)
                        .setURL(`https://forums.mangadex.org/threads/${statsData.comments.threadId}`)
                        .setStyle(ButtonStyle.Link)
                );
            } else {
                buttons.addComponents(
                    new ButtonBuilder()
                    .setLabel(translations.buttons.forum.no_thread)
                    .setURL('https://forums.mangadex.org/')
                    .setStyle(ButtonStyle.Link)
                    .setDisabled(true)
                );
            }
            
            // Send a follow-up message with the embed
            await interaction.followUp({ embeds: [embed], components: [buttons] });
    }
}