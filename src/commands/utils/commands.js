const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commands')
        .setDescription('Get the list of the commands you can use'),
    global: true,
    async execute(interaction, client) {
        const locale = interaction.locale;

        const title = client.translate(locale, 'commands', 'commands.response.title') || client.translate('en', 'commands', 'commands.response.title');
        const description = client.translate(locale, 'commands', 'commands.response.description') || client.translate('en', 'commands', 'commands.response.description');
        const footer = client.translate(locale, 'commands', 'commands.response.footer', { user: interaction.user.username }) || client.translate('en', 'commands', 'commands.response.footer', { user: interaction.user.username });

        // Retrieve both the global and guild commands
        const globalCommands = await client.application.commands.fetch();
        const guildCommands = await interaction.guild.commands.fetch();

        // Merge the global and guild commands
        const allCommands = new Map([...globalCommands, ...guildCommands]);

        // Initialize the array that will hold the available commands
        const availableCommandNames = [];
        const availableCommandDescriptions = [];

        const guildCommandPermissions = await interaction.guild.commands.permissions.fetch();

        // Filter the global commands that appear in the guildCommandPermissions map
        const filteredGlobalCommands = globalCommands.filter(command => guildCommandPermissions.has(command.id));
        // Filter the guild commands that appear in the guildCommandPermissions map
        const filteredGuildCommands = guildCommands.filter(command => guildCommandPermissions.has(command.id));

        // Merge the filtered global and guild commands
        const mergedCommands = new Map([...filteredGlobalCommands, ...filteredGuildCommands]);

        // Filter out from allCommands the commands that are in mergedCommands
        for (const command of mergedCommands.values()) {
            allCommands.delete(command.id);
        }

        // Loop through each command and check if it is available to the user
        for (const command of mergedCommands.values()) {
            // Fetch command permissions in the current guild
            const permissions = await interaction.guild.commands.permissions.fetch({ command: command.id });

            // Filter the permissions map to get the type 1 (role) and type 2 (user) permissions
            const roleMap = permissions.filter(p => p.type === 1);

            const userMap = permissions.filter(p => p.type === 2);

            // Filter the roleMap to get the roles that the user has
            const userRoles = interaction.member.roles.cache;

            // Get the user's role's IDs
            const userRoleIDs = userRoles.map(role => role.id);

            // Filter the roles that have the permission set to true
            const rolePermissions = roleMap.filter(p => p.permission === true);

            let hasRole = false;
            // For each role permission, check if the user has a role with the ID of the permission
            for (const perm of rolePermissions) {
                const hasRole = userRoleIDs.includes(perm.id);
                if (hasRole) break;
            }

            // Filter the users that have the permission set to true
            const userPermissions = userMap.filter(p => p.permission === true);

            // Check if the user's ID is in the userPermissions
            const hasUserPermission = userPermissions.some(p => p.id === interaction.user.id);

            // If the user has either role or user permission, add the command to the list of available commands
            if (hasRole || hasUserPermission) {
                availableCommandNames.push(command.name);
                availableCommandDescriptions.push(command.description);
            }
        }

        // Merge the allCommands map with the available commands
        const allCommandsArray = [...allCommands.values()];

        for (const command of allCommandsArray) {
            availableCommandNames.push(command.name);
            availableCommandDescriptions.push(command.description);
        }

        // Initialize the fields array
        const fields = [];

        // Loop through each available command and add it to the fields array
        for (let i = 0; i < availableCommandNames.length; i++) {
            fields.push({ name: availableCommandNames[i], value: availableCommandDescriptions[i] });
        }

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(fields)
            .setColor(Colors.Blurple)
            .setFooter({ text: `/commands | ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ content: "OK", embeds: [embed] });
    }
}