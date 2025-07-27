const { Colors, InteractionType } = require("discord.js");

/**
 * Sends an error embed in response to an interaction.
 * @param {import("discord.js").Interaction} interaction - The interaction object from Discord.js.
 * @param {Object} translations - The translations object containing localized strings.
 * @param {import("discord.js").EmbedBuilder} embed - The embed to be sent.
 * @param {string} errorKey - The key for the specific error message to be displayed.
 * @returns {Promise<void>} A promise that resolves when the embed is sent.
 */
const sendErrorEmbed = (interaction, translations, embed, errorKey) => {
    if (!embed) return;
    embed.setTitle(translations.embed.error.title)
        .setDescription(translations.embed.error.description[errorKey])
        .setColor(Colors.Red);

    if (interaction.type === InteractionType.MessageComponent) {
        embed.setDescription(translations.embed.error.description.api);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    return interaction.editReply({ embeds: [embed], ephemeral: true });
}

module.exports = sendErrorEmbed;