const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const translateAttribute = require('../../functions/handlers/translateAttribute');

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('nami', 'description')
        };
        return new SlashCommandBuilder()
        .setName('nami')
        .setDescription('Search for a title on NamiComi')
        .setDescriptionLocalizations(localizations.description);
    },
    async execute(interaction, client) {
        const locale = interaction.locale;
        const embed = new EmbedBuilder()
            .setTitle(await client.translate(locale, 'errors', 'working_on_cmd.title'))
            .setDescription(await client.translate(locale, 'errors', 'working_on_cmd.description'))
            .addFields(await client.translate(locale, 'errors', 'working_on_cmd.fields'))
            .setFooter({
                text: await client.translate(locale, 'errors', 'working_on_cmd.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username }),
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            })
            .setColor(Colors.Blurple);

        await interaction.reply({ embeds: [embed] });
    }
}