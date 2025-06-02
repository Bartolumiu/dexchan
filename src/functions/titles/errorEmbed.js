const { Colors, InteractionType } = require("discord.js");

const sendErrorEmbed = (interaction, translations, embed, errorKey) => {
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