const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { readdirSync } = require('fs');

module.exports = (client) => {
    client.handleCommands = async () => {
        const chalkInstance = await import('chalk');
        const chalk = chalkInstance.default;

        const { commands, guildCommands, globalCommands } = client;

        const commandFolders = readdirSync('./src/commands');

        // Folder debug logging
        const commandFolderCount = commandFolders.length;
        let currentCommandFolder = 1;

        for (const folder of commandFolders) {
            const commandFiles = readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));

            // Command debug logging
            const commandFileCount = commandFiles.length;
            let currentCommandFile = 1;

            for (const file of commandFiles) {
                try {
                    const command = require(`../../commands/${folder}/${file}`);
                    commands.set(command.data.name, command);

                    // Translate the command name and description
                    client.translateCommand(command.data, command.data.name, 'name');
                    client.translateCommand(command.data, command.data.name, 'description');

                    // If the command is global, add it to the globalCommands array
                    if (command.global) {
                        globalCommands.push(command.data.toJSON());
                        console.log(chalk.greenBright(`Global command ${command.data.name} loaded.`) + ` (${currentCommandFile}/${commandFileCount}) | (${currentCommandFolder}/${commandFolderCount})`);
                    } else {
                        if (!command.guildID) {
                            console.error(chalk.bgRedBright(`Command ${command.data.name} does not have a guildID set.`));
                            console.log(chalk.redBright(`Command ${command.data.name} failed to load.`) + ` (${currentCommandFile}/${commandFileCount}) | (${currentCommandFolder}/${commandFolderCount})`);
                            continue;
                        }

                        // Create a new collection for the guild if it doesn't exist
                        if (!guildCommands.has(command.guildID)) {
                            guildCommands.set(command.guildID, []);
                        }

                        // Add the command to the guildCommands collection
                        guildCommands.get(command.guildID).push(command.data.toJSON());
                        console.log(chalk.greenBright(`Guild command ${command.data.name} loaded.`) + ` (${currentCommandFile}/${commandFileCount}) | (${currentCommandFolder}/${commandFolderCount})`);
                    }
                    currentCommandFile++;
                } catch (e) {
                    console.error(chalk.redBright(`Error requiring ${file} in ${folder}: ${e}`));
                }
            }
            currentCommandFolder++;
        }

        const clientID = `${process.env.clientID}`;
        const rest = new REST({ version: '10' }).setToken(process.env.token);

        try {
            console.log(chalk.gray('Started refreshing global application (/) commands.'));
            await rest.put(
                Routes.applicationCommands(clientID), {
                    body: globalCommands
                },
            );

            // For each guild, refresh the guild commands
            for (const [guildID, commands] of guildCommands) {
                console.log(chalk.gray(`Started refreshing guild (/) commands for guild ${guildID}.`));
                await rest.put(
                    Routes.applicationGuildCommands(clientID, guildID), {
                        body: commands
                    },
                );
            }

            console.log(chalk.greenBright('Successfully reloaded application (/) commands.'));
        } catch (e) {
            console.error(e);
        }
    }
}