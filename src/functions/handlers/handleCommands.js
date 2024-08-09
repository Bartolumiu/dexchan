const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { readdirSync } = require('fs');

module.exports = (client) => {
    client.handleCommands = async () => {
        const chalkInstance = await import('chalk');
        const chalk = chalkInstance.default;

        const { commands } = client;

        const commandFolders = readdirSync('./src/commands');

        const clientID = `${process.env.clientID}`;
        const rest = new REST({ version: '10' }).setToken(process.env.token);

        const globalCommandList = [];
        const guildCommandMap = new Map();

        // Folder processing
        commandFolders.forEach((folder, folderIndex) => {
            const commandFiles = readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));

            // Process each command file in the folder
            commandFiles.forEach((file, fileIndex) => {
                try {
                    const command = require(`../../commands/${folder}/${file}`);
                    const { name } = command.data;
                    const { guildID, global } = command;

                    // Register command and translate
                    commands.set(name, command);
                    client.translateCommand(command.data, name, 'name');
                    client.translateCommand(command.data, name, 'description');

                    if (global) {
                        // Command is global
                        globalCommandList.push(command.data.toJSON());
                        console.log(chalk.greenBright(`Global command /${name} loaded.`) + ` (${fileIndex + 1}/${commandFiles.length}) | (${folderIndex + 1}/${commandFolders.length})`);
                    } else if (guildID) {
                        // Command is guild-specific
                        if (!guildCommandMap.has(guildID)) {
                            guildCommandMap.set(guildID, []);
                        }
                        guildCommandMap.get(guildID).push(command.data.toJSON());
                        console.log(chalk.greenBright(`Guild command /${name} loaded for guild ${guildID}.`) + ` (${fileIndex + 1}/${commandFiles.length}) | (${folderIndex + 1}/${commandFolders.length})`);
                    } else {
                        // Command is neither global nor guild-specific
                        console.warn(chalk.yellowBright(`Command /${name} does not have a guildID set and is not marked as global. Skipping.`));
                    }
                } catch (e) {
                    console.error(chalk.redBright(`Error requiring ${file} in ${folder}: ${e.message}`));
                }
            });
        });

        try {
            console.log(chalk.gray('Started refreshing global application (/) commands.'));
            await rest.put(Routes.applicationCommands(clientID), { body: globalCommandList });

            for (const [guildID, commands] of guildCommandMap) {
                console.log(chalk.gray(`Started refreshing guild (/) commands for guild ${guildID}.`));
                await rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: commands });
            }

            console.log(chalk.greenBright('Successfully reloaded application (/) commands.'));
        } catch (e) {
            console.error(chalk.redBright('Failed to reload application (/) commands.'), e);
        }
    };
};