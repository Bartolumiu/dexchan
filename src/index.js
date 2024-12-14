// Fetch variables from .env file and other dependencies
require('dotenv').config();
const { token, dbToken } = process.env;
const { connect } = require('mongoose');

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

const loadFunctions = require('./functions/handlers/handleFunctions');
// Asynchronously load functions
new Promise((resolve) => {
    (async () => {
        console.log((await import('chalk')).default.blueBright(`[NodeJS] Starting Dex-chan v${client.version}...`));
        await loadFunctions(client);
        resolve();
    })();
}).then(async () => {
    const chalk = (await import('chalk')).default;

    await client.handleEvents();
    await client.handleCommands();
    await client.handleComponents();
    await client.handleLocales();

    // Connect to MongoDB and login to Discord
    console.log(chalk.blueBright('[Discord] Logging in...'));
    await client.login(token).then(async () => {
        await connect(dbToken).catch(console.error);
        client.guilds.fetch(); // Cache all guilds
    }).catch(async (e) => {
        console.error((await import('chalk')).default.redBright('[Discord] Failed to login:', e));
    });
}).catch(async (e) => {
    console.error((await import('chalk')).default.redBright('[Function Loader] Failed to load functions:', e));
});