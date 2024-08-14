// Fetch variables from .env file and other dependencies
require('dotenv').config();
const { token, dbToken } = process.env;
const { connect } = require('mongoose');
const { readdirSync } = require('fs');

// Import Discord.JS and client attributes
const { Client, Collection, IntentsBitField } = require('discord.js');
const client = new Client({ intents: 32767 });
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();
client.guildCommands = new Collection();
client.globalCommands = [];

// Import version from package.json
client.version = require('../package.json').version;


// Read function files
const functionFolders = readdirSync('./src/functions');
for (const folder of functionFolders) {
    const functions = readdirSync(`./src/functions/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of functions) {
        try {
            const func = require(`./functions/${folder}/${file}`);
            if (typeof func === 'function') {
                func(client);
            } else {
                console.error(`Error: ${file} in ${folder} is not exporting a function.`);
            }
        } catch (e) {
            console.error(`error requiring ${file} in ${folder}: ${e}`);
        }
    }
}

client.handleEvents();
client.handleCommands();
client.handleComponents();
client.handleLocales();

// Connect to MongoDB and login to Discord
client.login(token);
client.guilds.fetch(); // Cache all guilds
(async () => {
    await connect(dbToken).catch(console.error);
})();