const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');

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

        // Retrieve both the global and guild commands, as well as the guild command permissions
        const globalCommands = await client.application.commands.fetch();
        const guildCommands = await interaction.guild.commands.fetch();
        const guildCommandPermissions = await interaction.guild.commands.permissions.fetch();

        // Merge the global and guild commands
        const allCommands = new Map([...globalCommands, ...guildCommands]);
        
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
        
        // Initialize the array that will hold the available commands
        const availableCommandNames = [];
        const availableCommandDescriptions = [];

        // Divide the remaining global commands into the ones that don't need permissions and the ones that do
        const globalCommandsPermissions = [];

        // If the command has a defaultMemberPermissions property, it requires permissions
        for (const command of allCommands.values()) {
            console.log(`Checking ${command.name} for default permissions`);
            console.log("Command default permissions:", command.defaultMemberPermissions);
            if (command.defaultMemberPermissions) {
                globalCommandsPermissions.push({ name: command.name, description: command.description, permissions: command.defaultMemberPermissions });
            } else {
                availableCommandNames.push(command.name);
                availableCommandDescriptions.push(command.description);
            }
        }

        // Loop through each command and check if it is available to the user
        for (const command of mergedCommands.values()) {
            const commandPermissions = guildCommandPermissions.get(command.id);

            const hasRole = hasRolePermission(commandPermissions, interaction);
            const hasUser = hasUserPermission(commandPermissions, interaction);

            // If the user has either role or user permission, add the command to the list of available commands
            if (hasRole || hasUser) {
                // TODO: For some reason, the command "/help" is being added to the list of available commands even though it shouldn't (temporarily set with the "Attach Files" permission for testing purposes)
                console.log(`Pushing ${command.name} to available commands`);
                availableCommandNames.push(command.name);
                availableCommandDescriptions.push(command.description);
            }
        }

        // For each command that requires permissions, convert the bitfield into an array of permissions and check if the user has them
        for (const command of globalCommandsPermissions) {
            // Get the bitfield of permissions required by the command
            const permissions = command.permissions;

            if (interaction.member.permissions.has(permissions)) {
                // User has the permissions required by the command, add it to the list of available commands
                availableCommandNames.push(command.name);
                availableCommandDescriptions.push(command.description);
            }
        }
        

        // Initialize the fields array
        const fields = [];

        // Loop through each available command and add it to the fields array
        for (let i = 0; i < availableCommandNames.length; i++) {
            console.log(`Adding ${availableCommandNames[i]} with description ${availableCommandDescriptions[i]} to the fields array`);
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

const hasRolePermission = (commandPermissions, interaction) => {
    const roleMap = commandPermissions.filter(p => p.type === 1);

    const userRoles = interaction.member.roles.cache;

    const userRoleIDs = userRoles.map(role => role.id);

    const rolePermissions = roleMap.filter(p => p.permission === true);

    let hasRole = false;

    for (const perm of rolePermissions) {
        hasRole = userRoleIDs.includes(perm.id);
        if (hasRole) break;
    }

    return hasRole;
};

const hasUserPermission = (commandPermissions, interaction) => {
    const userMap = commandPermissions.filter(p => p.type === 2);

    const userPermissions = userMap.filter(p => p.permission === true);

    const hasUserPermission = userPermissions.some(p => p.id === interaction.user.id);

    return hasUserPermission;
};