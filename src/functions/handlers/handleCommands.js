const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { readdirSync } = require('fs');
const getChalk = require('../tools/getChalk');

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
        const chalk = await getChalk();
        console.log(chalk.blueBright('[Command Handler] Loading commands...'));
        const { commands } = client;

        const commandFolders = readdirSync('./src/commands');

        const globalCommandList = [];
        const guildCommandMap = new Map();

        // Folder processing
        for (const folder of commandFolders) {
            const commandFiles = readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));

            // File processing
            await handleFiles(commandFiles, folder, commands, globalCommandList, guildCommandMap);
        };

        // Register commands
        await refreshCommands(globalCommandList, guildCommandMap);
    };
};

/**
 * Refreshes the global and guild-specific application (/) commands.
 *
 * @param {Array} globalCommandList - The list of global commands to be registered.
 * @param {Map} guildCommandMap - A map where the key is the guild ID and the value is the list of commands for that guild.
 * @returns {Promise<void>} - A promise that resolves when the commands have been refreshed.
 */
async function refreshCommands(globalCommandList, guildCommandMap) {
    const chalk = await getChalk();
    const clientID = `${process.env.clientID}`;
    const rest = new REST({ version: '10' }).setToken(process.env.token);
    try {
        console.log(chalk.blueBright('[Command Handler] Started refreshing global application (/) commands.'));
        await rest.put(Routes.applicationCommands(clientID), { body: globalCommandList });

        for (const [guildID, commands] of guildCommandMap) {
            console.log(chalk.gray(`[Command Handler] Started refreshing guild (/) commands for guild ${guildID}.`));
            await rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: commands });
        }

        console.log(chalk.greenBright('[Command Handler] Successfully reloaded application (/) commands.'));
    } catch (e) {
        console.error(chalk.redBright('[Command Handler] Failed to reload application (/) commands.'), e);
    }
}

/**
 * Handles the loading of command files.
 *
 * @async
 * @function handleFiles
 * @param {string[]} commandFiles - An array of command file names to be loaded.
 * @param {string} folder - The folder containing the command files.
 * @param {Map} commands - The map of all commands.
 * @param {Array} globalCommandList - The list of global commands.
 * @param {Map} guildCommandMap - The map of guild-specific commands.
 * @returns {Promise<void>} - A promise that resolves when all command files have been processed.
 * @throws {Error} - Throws an error if there is an issue requiring a command file.
 */
async function handleFiles(commandFiles, folder, commands, globalCommandList, guildCommandMap) {
    const chalk = await getChalk();
    for (const file of commandFiles) {
        try {
            const command = require(`../../commands/${folder}/${file}`);
            if (command.data) await loadCommand(command, commands, globalCommandList, guildCommandMap);
            else console.warn(chalk.yellowBright(`[Command Handler] Command file ${file} in ${folder} does not have a data property. Skipping.`));
        } catch (e) {
            console.error(chalk.redBright(`[Command Handler] Error requiring ${file} in ${folder}: ${e.message}`));
        }
    }
}


/**
 * Loads a command into the appropriate command list and logs the action.
 *
 * @param {Object} command - The command object to be loaded.
 * @param {Map} commands - The map of all commands.
 * @param {Array} globalCommandList - The list of global commands.
 * @param {Map} guildCommandMap - The map of guild-specific commands.
 * @returns {Promise<void>} - A promise that resolves when the command is loaded.
 */
async function loadCommand(command, commands, globalCommandList, guildCommandMap) {
    const chalk = await getChalk();
    if (typeof command.data === 'function') command.data = await command.data();
    commands.set(command.data.name, command);

    if (command.global) {
        globalCommandList.push(command.data.toJSON());
        console.log(chalk.greenBright(`[Command Handler] Global command /${command.data.name} loaded.`));
    } else if (command.guildID) {
        if (!guildCommandMap.has(command.guildID)) {
            guildCommandMap.set(command.guildID, []);
        }
        guildCommandMap.get(command.guildID).push(command.data.toJSON());
        console.log(chalk.greenBright(`[Command Handler] Guild command /${command.data.name} loaded for guild ${command.guildID}.`));
    } else {
        console.warn(chalk.yellowBright(`[Command Handler] Command /${command.data.name} does not have a guildID set and is not marked as global. Skipping.`));
    }
}