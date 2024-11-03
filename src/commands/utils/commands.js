const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const translateAttribute = require('../../functions/handlers/translateAttribute');

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('commands', 'description')
        }
        return new SlashCommandBuilder()
            .setName('commands')
            .setDescription('Get the list of the commands you can use')
            .setDescriptionLocalizations(localizations.description);
    },
    async execute(interaction, client) {
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;
        const translations = {
            title: await client.translate(locale, 'commands', 'commands.response.title'),
            description: await client.translate(locale, 'commands', 'commands.response.description'),
            footer: await client.translate(locale, 'commands', 'commands.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username })
        };

        // Retrieve both the global and guild commands, as well as the guild command permissions
        const globalCommands = await client.application.commands.fetch();
        const guildCommands = await interaction.guild.commands.fetch();
        const guildCommandPermissions = await interaction.guild.commands.permissions.fetch();

        // Merge the global and guild commands
        const allCommands = new Map([...globalCommands, ...guildCommands]);

        // Filter available commands based on user permissions
        const availableCommands = [...allCommands.values()].filter(command => {
            const permissions = guildCommandPermissions.get(command.id);

            // Check defaultMemberPermissions for global commands
            if (command.defaultMemberPermissions) {
                if (!interaction.member.permissions.has(command.defaultMemberPermissions)) return false; // The member doesn't have the required permissions
            }

            if (!permissions) return true; // If there are no specific permissions set for the command, it's available to everyone

            const hasRolePerm = hasRolePermission(permissions, interaction);
            const hasUserPerm = hasUserPermission(permissions, interaction);

            return hasRolePerm || hasUserPerm;
        });

        let fields = [];

        for (const command of availableCommands) {
            const name = `/${command.name}`;
            const value = await client.translate(locale, 'commands', `${command.name}.description`);
            fields.push({ name, value });
        }

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle(translations.title)
            .setDescription(translations.description)
            .addFields(fields)
            .setColor(Colors.Blurple)
            .setFooter({ text: translations.footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}

/**
 * Checks if the user has the required role permissions for a command.
 *
 * @param {Array} commandPermissions - An array of permission objects for the command.
 * @param {Object} interaction - The interaction object containing user and role information.
 * @param {Object} interaction.member - The member object containing role information.
 * @param {Object} interaction.member.roles - The roles object containing the user's roles.
 * @param {Map} interaction.member.roles.cache - A map of the user's roles.
 * @returns {boolean} - Returns true if the user has the required role permissions, otherwise false.
 */
const hasRolePermission = (commandPermissions, interaction) => {
    const rolePermissions = commandPermissions.filter(p => p.type === 1 && p.permission === true);
    const userRoleIDs = interaction.member.roles.cache.map(role => role.id);
    return rolePermissions.some(p => userRoleIDs.includes(p.id));
};

/**
 * Checks if the user has the required permissions for a command.
 *
 * @param {Array} commandPermissions - The list of permissions associated with the command.
 * @param {Object} interaction - The interaction object containing user information.
 * @param {Object} interaction.user - The user object within the interaction.
 * @param {string} interaction.user.id - The ID of the user.
 * @returns {boolean} - Returns true if the user has the required permissions, otherwise false.
 */
const hasUserPermission = (commandPermissions, interaction) => {
    const userPermissions = commandPermissions.filter(p => p.type === 2 && p.permission === true);
    return userPermissions.some(p => p.id === interaction.user.id);
};