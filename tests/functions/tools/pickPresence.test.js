const pickPresence = require('../../../src/functions/tools/pickPresence');
const { ActivityType } = require('discord.js');

describe('pickPresence', () => {
    let client;

    beforeEach(() => {
        client = {
            user: {
                setPresence: jest.fn()
            },
            version: '1.0.0'
        };

        pickPresence(client);
    });

    test('should set a random presence from the predefined list', async () => {
        await client.pickPresence();

        expect(client.user.setPresence).toHaveBeenCalledTimes(1);

        const presenceArg = client.user.setPresence.mock.calls[0][0];
        expect(presenceArg).toHaveProperty('activities');
        expect(presenceArg.activities).toHaveLength(1);
        expect(presenceArg.activities[0]).toHaveProperty('name');
        expect(presenceArg.activities[0]).toHaveProperty('type');
        expect(presenceArg).toHaveProperty('status');

        const validActivities = [
            `Watching over the server | v${client.version}`,
            `Playing with the API | v${client.version}`,
            `Listening to music with Nami | v${client.version}`,
            `Reading manga | v${client.version}`
        ];

        expect(validActivities).toContain(presenceArg.activities[0].name);
        expect(presenceArg.activities[0].type).toBe(ActivityType.Custom);
        expect(presenceArg.status).toBe('ONLINE');
    });
});