const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const { translateAttribute } = require('../../functions/handlers/handleLocales');

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('help', 'description')
        };
        return new SlashCommandBuilder()
            .setName('help')
            .setDescription('Get help with using the bot')
            .setDescriptionLocalizations(localizations.description);
    },
    async execute(interaction, client) {
        const userProfile  = await client.getMongoUserData(interaction.user);
        const locale = client.getLocale(userProfile, interaction);
        const translations = {
            title: await client.translate(locale, 'commands', 'help.response.title'),
            fields: [
                {
                    name: await client.translate(locale, 'commands', 'help.response.fields.commands.name'),
                    value: await client.translate(locale, 'commands', 'help.response.fields.commands.value')
                },
                {
                    name: await client.translate(locale, 'commands', 'help.response.fields.support.name'),
                    value: await client.translate(locale, 'commands', 'help.response.fields.support.value')
                },
                {
                    name: await client.translate(locale, 'commands', 'help.response.fields.invite.name'),
                    value: await client.translate(locale, 'commands', 'help.response.fields.invite.value')
                },
                {
                    name: await client.translate(locale, 'commands', 'help.response.fields.stats.name'),
                    value: await client.translate(locale, 'commands', 'help.response.fields.stats.value')
                },
                {
                    name: await client.translate(locale, 'commands', 'help.response.fields.uptime.name'),
                    value: await client.translate(locale, 'commands', 'help.response.fields.uptime.value')
                }
            ],
            footer: await client.translate(locale, 'commands', 'help.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username }),
        };

        const embed = new EmbedBuilder()
            .setTitle(translations.title)
            .addFields(translations.fields)
            .setColor(Colors.Blurple)
            .setFooter({ text: translations.footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};