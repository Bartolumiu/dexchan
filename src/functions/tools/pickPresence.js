const { ActivityType } = require('discord.js');

/**
 * Sets a random presence for the Discord client from a predefined list of activities.
 *
 * @param {Object} client - The Discord client instance.
 * @param {Object} client.user - The user object of the client.
 * @param {Function} client.user.setPresence - Function to set the presence of the client.
 * @param {string} client.version - The version of the client.
 * @param {Object} options - Additional options for setting the presence (currently unused).
 */
module.exports = (client) => {
    client.pickPresence = async (options) => {
        const ActivityOptions = [
            {
                type: ActivityType.Custom,
                text: `Watching over the server | v${client.version}`,
                status: 'ONLINE'
            },
            {
                type: ActivityType.Custom,
                text: `Playing with the API | v${client.version}`,
                status: 'ONLINE'
            },
            {
                type: ActivityType.Custom,
                text: `Listening to music with Nami | v${client.version}`,
                status: 'ONLINE'
            },
            {
                type: ActivityType.Custom,
                text: `Reading manga | v${client.version}`,
                status: 'ONLINE'
            }
        ]
        const option = Math.floor(Math.random() * ActivityOptions.length);

        client.user.setPresence({
            activities: [
                {
                    name: ActivityOptions[option].text,
                    type: ActivityOptions[option].type
                },
            ],
            status: ActivityOptions[option].status
        });
    }
}