const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const translateAttribute = require('../../functions/handlers/handleLocales');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Change your settings')
        .setDescriptionLocalizations(translateAttribute('settings', 'description'))
        .addSubcommandGroup(group =>
            group.setName('locale')
                .setDescription('Your preferred locale')
                .setDescriptionLocalizations(translateAttribute('settings', 'subcommand_groups[0].description'))
                .addSubcommand(command =>
                    command.setName('set')
                        .setDescription('Set your preferred locale')
                        .setDescriptionLocalizations(translateAttribute('settings', 'subcommand_groups[0].subcommands[0].description'))
                        .addStringOption(option =>
                            option.setName('locale')
                                .setDescription('The language you want to set as your preferred language')
                                .setDescriptionLocalizations(translateAttribute('settings', 'subcommand_groups[0].subcommands[0].options[0].description'))
                                .setRequired(true)
                        )
                )
                .addSubcommand(command =>
                    command.setName('reset')
                        .setDescription('Reset your preferred locale')
                        .setDescriptionLocalizations(translateAttribute('settings', 'subcommand_groups[0].subcommands[1].description'))
                ),
        )
        .addSubcommand(command =>
            command.setName('view')
                .setDescription('View your settings')
                .setDescriptionLocalizations(translateAttribute('settings', 'subcommand_groups[1].description'))
        ),
    async execute(interaction, client) {
        const userProfile = await client.getMongoUserData(interaction.user);
        const embed = new EmbedBuilder();
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'locale') await localeSettings(interaction, client, userProfile, embed);
        else if (subcommand === 'view') await viewSettings(interaction, client, userProfile, embed);

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function localeSettings(interaction, client, userProfile, embed) {
    switch (interaction.options.getSubcommand()) {
        case 'set':
            try {
                const locale = interaction.options.getString('locale');
                userProfile.preferredLocale = locale; // Set the user's preferred locale
                await userProfile.save();
                embed.setTitle(await client.translate(userProfile.preferredLocale, 'settings', 'subcommand_groups[0].subcommands[0].response.title.success'));
                embed.setDescription(await client.translate(userProfile.preferredLocale, 'settings', 'subcommand_groups[0].subcommands[0].response.description.success', { locale: locale }));
                embed.setColor(Colors.Green);
            } catch (e) {
                embed.setTitle(await client.translate(userProfile.preferredLocale, 'settings', 'subcommand_groups[0].subcommands[0].response.title.error'));
                embed.setDescription(await client.translate(userProfile.preferredLocale, 'settings', 'subcommand_groups[0].subcommands[0].response.description.error'));
                embed.setColor(Colors.Red);
            }
            embed.setFooter(await client.translate(userProfile.preferredLocale, 'settings', 'response.footer', { commandName: interaction.commandName, user: interaction.user.username }));
            break;
        case 'reset':
            try {
                userProfile.preferredLocale = null;
                await userProfile.save();
                embed.setTitle(await client.translate(userProfile.preferredLocale, 'settings', 'subcommand_groups[0].subcommands[1].response.title.success'));
                embed.setDescription(await client.translate(userProfile.preferredLocale, 'settings', 'subcommand_groups[0].subcommands[1].response.description.success'));
                embed.setColor(Colors.Green);
            } catch (e) {
                embed.setTitle(await client.translate(userProfile.preferredLocale, 'settings', 'subcommand_groups[0].subcommands[1].response.title.error'));
                embed.setDescription(await client.translate(userProfile.preferredLocale, 'settings', 'subcommand_groups[0].subcommands[1].response.description.error'));
                embed.setColor(Colors.Red);
            }
            embed.setFooter(await client.translate(userProfile.preferredLocale, 'settings', 'response.footer', { commandName: interaction.commandName, user: interaction.user.username }));
            break;
        default:
            break;
    }
}

async function viewSettings(interaction, client, userProfile, embed) {
    const locale = userProfile.preferredLocale || interaction.locale;
    embed.setTitle(await client.translate(locale, 'settings', 'subcommand_groups[1].response.title'));
    embed.setDescription(await client.translate(locale, 'settings', 'subcommand_groups[1].response.description', { locale: userProfile.preferredLocale || interaction.locale }));
    embed.setFooter(await client.translate(locale, 'settings', 'response.footer', { commandName: interaction.commandName, user: interaction.user.username }));
    embed.setColor(Colors.Blue);
}