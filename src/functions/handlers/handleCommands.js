const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { readdirSync } = require('fs');

/**
 * Handles the loading and registration of Discord commands for the client.
 * 
 * This function reads command files from the specified directories, processes them,
 * and registers them as either global or guild-specific commands using the Discord API.
 * 
 * @param {Object} client - The Discord client instance.
 * @param {Map} client.commands - A collection to store the commands.
 * 
 * @requires @discordjs/rest
 * @requires discord-api-types/v10
 * @requires fs
 * 
 * @example
 * const client = {
 *   commands: new Map(),
 *   handleCommands: null
 * };
 * require('./handleCommands')(client);
 * client.handleCommands();
 */
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
        for (const folder of commandFolders) {
            const commandFiles = readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                try {
                    const command = require(`../../commands/${folder}/${file}`);

                    if (command.data) {
                        if (typeof command.data === 'function') {
                            command.data = await command.data();
                        }
                        commands.set(command.data.name, command);

                        if (command.global) {
                            globalCommandList.push(command.data.toJSON());
                            console.log(chalk.greenBright(`[Command Handler] Global command /${command.data.name} loaded.`) + ` (${commandFiles.indexOf(file) + 1}/${commandFiles.length}) | (${commandFolders.indexOf(folder) + 1}/${commandFolders.length})`);
                        } else if (command.guildID) {
                            if (!guildCommandMap.has(command.guildID)) {
                                guildCommandMap.set(command.guildID, []);
                            }
                            guildCommandMap.get(command.guildID).push(command.data.toJSON());
                            console.log(chalk.greenBright(`[Command Handler] Guild command /${command.data.name} loaded for guild ${command.guildID}.`) + ` (${commandFiles.indexOf(file) + 1}/${commandFiles.length}) | (${commandFolders.indexOf(folder) + 1}/${commandFolders.length})`);
                        } else {
                            console.warn(chalk.yellowBright(`[Command Handler] Command /${command.data.name} does not have a guildID set and is not marked as global. Skipping.`));
                        }
                    } else {
                        console.warn(chalk.yellowBright(`[Command Handler] Command file ${file} in ${folder} does not have a data property. Skipping.`));
                    }
                } catch (e) {
                    console.error(chalk.redBright(`[Command Handler] Error requiring ${file} in ${folder}: ${e.message}`));
                }
            }
        };
        try {
            console.log(chalk.gray('[Command Handler] Started refreshing global application (/) commands.'));
            await rest.put(Routes.applicationCommands(clientID), { body: globalCommandList });

            for (const [guildID, commands] of guildCommandMap) {
                console.log(chalk.gray(`[Command Handler] Started refreshing guild (/) commands for guild ${guildID}.`));
                await rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: commands });
            }

            console.log(chalk.greenBright('[Command Handler] Successfully reloaded application (/) commands.'));
        } catch (e) {
            console.error(chalk.redBright('[Command Handler] Failed to reload application (/) commands.'), e);
        }
    };
};