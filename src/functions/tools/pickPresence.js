const { ActivityType } = require('discord.js');

module.exports = (client) => {
    client.pickPresence = async (options) => {
        const ActivityOptions = [
            {
                type: ActivityType.Watching,
                text: `over the server | v${client.version}`,
                status: 'ONLINE'
            },
            {
                type: ActivityType.Playing,
                text: `with the API | v${client.version}`,
                status: 'ONLINE'
            },
            {
                type: ActivityType.Listening,
                text: `music with Nami | v${client.version}`,
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