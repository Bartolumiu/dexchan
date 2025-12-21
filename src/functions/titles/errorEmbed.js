const { Colors, InteractionType } = require("discord.js");

/**
 * Sends an error embed in response to an interaction.
 * @param {import("discord.js").Interaction} interaction - The interaction object from Discord.js.
 * @param {Object} translations - The translations object containing localized strings.
 * @param {import("discord.js").EmbedBuilder} embed - The embed to be sent.
 * @param {string} errorKey - The key for the specific error message to be displayed.
 * @param {Object} [replacements={}] - Optional replacements for dynamic content in the error message.
 * @returns {Promise<void>|void} A promise that resolves when the embed is sent or void if no embed is provided.
 */
const sendErrorEmbed = (interaction, translations, embed, errorKey, replacements = {}) => {
    if (!embed) return;
    const description = translations.response.error.description[errorKey];
    if (!description) return;
    if (replacements) {
        for (const [key, value] of Object.entries(replacements)) {
            description.replaceAll(`{${key}}`, value);
        }
    }

    embed.setTitle(translations.response.error.title)
        .setDescription(description)
        .setColor(Colors.Red);

    if (interaction.type === InteractionType.MessageComponent) {
        embed.setDescription(translations.response.error.description.api);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    return interaction.editReply({ embeds: [embed], ephemeral: true });
}

module.exports = sendErrorEmbed;