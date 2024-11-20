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

console.log(`[NodeJS] Starting Dex-chan v${client.version}...`);
const loadFunctions = require('./functions/handlers/handleFunctions');
loadFunctions(client);

client.handleEvents();
client.handleCommands();
client.handleComponents();
client.handleLocales();

// Connect to MongoDB and login to Discord
client.login(token).then(async () => {
    await connect(dbToken).catch(console.error);
    client.guilds.fetch(); // Cache all guilds
}).catch(e => {
    console.error('[Discord] Failed to login:', e);
});