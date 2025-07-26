// Application initialization logic separated for easy testing
const { Client, Collection } = require('discord.js');
const { connect } = require('mongoose');
const getChalk = require('../functions/tools/getChalk');

/**
 * Creates and configures a Discord client with all required collections
 * @returns {Client} Configured Discord client
 */
function createClient() {
    const client = new Client({ intents: 32767 });
    client.commands = new Collection();
    client.buttons = new Collection();
    client.selectMenus = new Collection();
    client.modals = new Collection();
    client.guildCommands = new Collection();
    client.globalCommands = [];
    
    // Set version from package.json
    client.version = require('../../package.json').version;
    
    return client;
}

/**
 * Loads all application functions and handlers
 * @param {Client} client - Discord client instance
 */
async function loadApplicationHandlers(client) {
    const loadFunctions = require('../functions/handlers/handleFunctions');
    await loadFunctions(client);
}

/**
 * Connects to Discord and MongoDB
 * @param {string} token - Discord bot token
 * @param {string} dbToken - MongoDB connection string
 */
async function connectServices(token, dbToken) {
    await connect(dbToken);
}

/**
 * Logs a message with chalk colors
 * @param {string} message - Message to log
 */
async function logMessage(message) {
    try {
        const chalk = await getChalk();
        console.log(chalk.blueBright(message));
    } catch {
        // Fallback to regular console.log if chalk import fails
        console.log(message);
    }
}

/**
 * Logs an error message with chalk colors
 * @param {string} message - Error message to log
 */
async function logError(message) {
    try {
        const chalk = await getChalk();
        console.log(chalk.redBright(message));
    } catch {
        // Fallback to regular console.log if chalk import fails
        console.log(message);
    }
}

/**
 * Main application initialization
 * @param {Object} config - Configuration object
 * @param {string} config.token - Discord bot token
 * @param {string} config.dbToken - MongoDB connection string
 */
async function initializeApplication({ token, dbToken }) {
    const client = createClient();
    
    await logMessage(`Starting Dex-chan v${client.version}...`);
    
    // Load all handlers and functions
    await loadApplicationHandlers(client);
    
    // Connect to services
    await connectServices(token, dbToken);
    await client.login(token);

    await logMessage(`✅ Ready as ${client.user.tag}! Logged in and connected to MongoDB.`);

    // Check for updates
    const readyEvent = require('../events/client/ready');
    client.on(readyEvent.name, readyEvent.execute.bind(null, client));

    return client;
}

module.exports = {
    createClient,
    loadApplicationHandlers,
    connectServices,
    logMessage,
    logError,
    initializeApplication
};
