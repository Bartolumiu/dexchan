const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const translateAttribute = require('../../functions/handlers/translateAttribute');
const fs = require('fs');

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('settings', 'description'),
            subcommands: {
                view: {
                    description: await translateAttribute('settings', 'subcommands.view.description')
                }
            },
            subcommand_groups: {
                locale: {
                    description: await translateAttribute('settings', 'subcommand_groups.locale.description'),
                    subcommands: {
                        set: {
                            description: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.set.description'),
                            options: {
                                locale: {
                                    description: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.set.options.locale.description')
                                }
                            }
                        },
                        reset: {
                            description: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.reset.description')
                        }
                    }
                }
            }
        }
        return new SlashCommandBuilder()
            .setName('settings')
            .setDescription('Change your settings')
            .setDescriptionLocalizations(localizations.description)
            .addSubcommand(command =>
                command.setName('view')
                    .setDescription('View your settings')
                    .setDescriptionLocalizations(localizations.subcommands.view.description))
            .addSubcommandGroup(group =>
                group.setName('locale')
                    .setDescription('Your preferred locale')
                    .setDescriptionLocalizations(localizations.subcommand_groups.locale.description)
                    .addSubcommand(command =>
                        command.setName('set')
                            .setDescription('Set your preferred locale')
                            .setDescriptionLocalizations(localizations.subcommand_groups.locale.subcommands.set.description)
                            .addStringOption(option =>
                                option.setName('locale')
                                    .setDescription('The language you want to set as your preferred language')
                                    .setDescriptionLocalizations(localizations.subcommand_groups.locale.subcommands.set.options.locale.description)
                                    .setAutocomplete(true)
                                    .setRequired(true)
                            )
                    )
                    .addSubcommand(command =>
                        command.setName('reset')
                            .setDescription('Reset your preferred locale')
                            .setDescriptionLocalizations(localizations.subcommand_groups.locale.subcommands.reset.description)
                    ),
            );
    },
    async execute(interaction, client) {
        const userProfile = await client.getMongoUserData(interaction.user);
        const embed = new EmbedBuilder();
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'locale') await localeSettings(interaction, client, userProfile, embed);
        else if (subcommand === 'view') await viewSettings(interaction, client, userProfile, embed);

        embed.setFooter({ text: await client.translate((userProfile.preferredLocale || interaction.locale), 'commands', 'settings.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username }), iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
        interaction.reply({ embeds: [embed], ephemeral: true });
    },
    async autocomplete(interaction) {
        const subcommandGroup = interaction.options.getSubcommandGroup().toLowerCase();
        const subcommand = interaction.options.getSubcommand().toLowerCase();

        if (subcommandGroup === 'locale' && subcommand === 'set') {
            const locales = await getLocaleList(interaction);
            return interaction.respond(locales);
        }
    }
}

/**
 * Get a list of locales based on the user's input.
 * 
 * @param {*} interaction - The interaction object from the Discord API.
 * @returns 
 */
async function getLocaleList(interaction) {
    // Get locale files
    const files = fs.readdirSync(__dirname+'/../../locales').filter(file => file.endsWith('.json'));
    const locales = files.map(file => file.split('.')[0]);
    // Read locale files and get the locale name
    const localeList = locales.map(locale => {
        const localeData = require(__dirname+`/../../locales/${locale}.json`);
        return {
            name: `${localeData.locale.name} (${localeData.locale.code})`,
            value: localeData.locale.code
        }
    });

    // Filter locales based on the user's input
    if (interaction.options.getString('locale')) {
        const input = interaction.options.getString('locale').toLowerCase();
        return localeList.filter(locale => locale.name.toLowerCase().includes(input) || locale.value.toLowerCase().includes(input));
    } else return localeList;
}

/**
 * Handles locale settings for a user profile based on the interaction subcommand.
 *
 * @param {Object} interaction - The interaction object from the Discord API.
 * @param {Object} client - The Discord client instance.
 * @param {Object} userProfile - The user profile object containing user settings.
 * @param {Object} embed - The embed object used to send responses.
 */
async function localeSettings(interaction, client, userProfile, embed) {
    switch (interaction.options.getSubcommand()) {
        case 'set':
            try {
                const currentLocale = userProfile.preferredLocale || interaction.locale;
                const locale = interaction.options.getString('locale');

                // Ensure the locale is valid before setting it
                const validLocales = await getLocaleList(interaction);
                const isValidLocale = validLocales.some(validLocale => validLocale.value === locale);
                
                if (!isValidLocale) {
                    embed.setTitle(await client.translate(currentLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error.invalid_locale'));
                    embed.setDescription(await client.translate(currentLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error.invalid_locale', { locale: locale }));
                    embed.setColor(Colors.Red);
                    return;
                }

                // Check if the user's preferred locale is already set
                if (userProfile.preferredLocale === locale) {
                    embed.setTitle(await client.translate(currentLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error.no_changes'));
                    embed.setDescription(await client.translate(currentLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error.no_changes', { locale: locale }));
                    embed.setColor(Colors.Red);
                    return;
                }

                userProfile.preferredLocale = locale; // Set the user's preferred locale
                await userProfile.save();
                embed.setTitle(await client.translate(currentLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.success'));
                embed.setDescription(await client.translate(currentLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.success', { locale: locale }));
                embed.setColor(Colors.Green);
            } catch (e) {
                const currentLocale = userProfile.preferredLocale || interaction.locale;
                embed.setTitle(await client.translate(currentLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error.unknown'));
                embed.setDescription(await client.translate(currentLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error.unknown'));
                embed.setColor(Colors.Red);
            }
            break;
        case 'reset':
            try {
                console.log('Resetting locale');
                userProfile.preferredLocale = null;
                console.log('Saving profile');
                await userProfile.save();
                console.log('Profile saved');
                embed.setTitle(await client.translate(interaction.locale, 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.success'));
                embed.setDescription(await client.translate(interaction.locale, 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.success'));
                embed.setColor(Colors.Green);
                console.log('Response sent');
            } catch (e) {
                console.log('Error resetting locale:', e);
                if (userProfile.preferredLocale) {
                    console.log('Preferred locale:', userProfile.preferredLocale);
                    embed.setTitle(await client.translate(userProfile.preferredLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.error'));
                    embed.setDescription(await client.translate(userProfile.preferredLocale, 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.error'));
                } else {
                    console.log('No preferred locale (it worked but still threw an error):', userProfile.preferredLocale);
                    embed.setTitle(await client.translate(interaction.locale, 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.error'));
                    embed.setDescription(await client.translate(interaction.locale, 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.error'));
                }
                embed.setColor(Colors.Red);
            }
            break;
        default:
            break;
    }
}

/**
 * Displays the user settings in an embedded message.
 *
 * @param {Object} interaction - The interaction object from the Discord API.
 * @param {Object} client - The Discord client instance.
 * @param {Object} userProfile - The user's profile containing their settings.
 * @param {Object} embed - The embed object to format the message.
 */
async function viewSettings(interaction, client, userProfile, embed) {
    const locale = userProfile.preferredLocale || interaction.locale;
    embed.setTitle(await client.translate(locale, 'commands', 'settings.subcommands.view.response.title'));
    embed.setDescription(await client.translate(locale, 'commands', 'settings.subcommands.view.response.description', { locale: locale }));
    embed.addFields(
        {
            name: await client.translate(locale, 'commands', 'settings.subcommands.view.response.fields.locale.name'),
            value: await client.translate(locale, 'commands', 'settings.subcommands.view.response.fields.locale.value', { locale: locale }),
            inline: true
        }
    )
    embed.setColor(Colors.Blue);
}