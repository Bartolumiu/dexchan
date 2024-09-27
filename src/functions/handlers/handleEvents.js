const { readdirSync } = require('fs');
const { connection } = require('mongoose');


/**
 * Asynchronously handles client events by loading event files and registering them with the client.
 *
 * @param {Object} client - The client object that will handle the events.
 * @param {Array<string>} eventFiles - An array of filenames for the event files to be loaded.
 * @returns {Promise<void>} A promise that resolves when all events have been registered.
 */
const handleClientEvents = async (client, eventFiles) => {
    for (const file of eventFiles) {
        const event = require(`../../events/client/${file}`);
        if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
        else client.on(event.name, (...args) => event.execute(...args, client));
    }
};


/**
 * Handles MongoDB events by loading event files and attaching them to the MongoDB client.
 *
 * @param {Object} client - The MongoDB client instance.
 * @param {string[]} eventFiles - An array of event file names to be loaded and handled.
 * @returns {Promise<void>} A promise that resolves when all events have been handled.
 */
const handleMongoEvents = async (client, eventFiles) => {
    for (const file of eventFiles) {
        const event = require(`../../events/mongo/${file}`);
        if (event.once) connection.once(event.name, (...args) => event.execute(...args, client));
        else connection.on(event.name, (...args) => event.execute(...args, client));
    }
};

/**
 * Handles the loading and execution of events.
 * @param {*} client - The Discord client instance.
 */
module.exports = (client) => {
    client.handleEvents = async () => {
        const eventFolders = readdirSync('./src/events');
        for (const folder of eventFolders) {
            const eventFiles = readdirSync(`./src/events/${folder}`).filter(file => file.endsWith('.js'));
            switch (folder) {
                case 'client':
                    await handleClientEvents(client, eventFiles);
                    break;
                case 'mongo':
                    await handleMongoEvents(client, eventFiles);
                    break;
                default:
                    console.error(`[Event Handler] Error: ${folder} is not a valid event folder.`);
                    break;
            }
        }
    };
};