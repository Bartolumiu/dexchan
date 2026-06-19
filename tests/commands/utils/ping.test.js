const { Colors } = require('discord.js');
const pingCommand = require('../../../src/commands/utils/ping');
const { translateAttribute } = require('../../../src/functions/handlers/handleLocales');

jest.mock('../../../src/functions/handlers/handleLocales', () => ({
    translateAttribute: jest.fn().mockResolvedValue({ 'en-GB': 'translated string' }),
}));

describe('ping command', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    })

    describe('data', () => {
        it('should build the slash command with correct localizations', async () => {
            const command = {
                name: 'ping',
                description: 'Check the bot\'s latency',
                descriptionLocalizations: await translateAttribute('ping', 'description')
            };

            await pingCommand.data();
            expect(command.name).toBe('ping');
            expect(command.description).toBe('Check the bot\'s latency');
            expect(command.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
        });
    });

    describe('execute', () => {
        it('should send a ping embed', async () => {
            global.fetch = jest.fn().mockImplementation(() => Promise.resolve({ ok: true }));
            //global.fetch = jest.fn().mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({data: { ping: 100 }})}))

            const interaction = {
                user: { id: '000000000000000000', username: 'test-user' },
                deferReply: jest.fn().mockResolvedValue({ createdTimestamp: 1000 }),
                editReply: jest.fn(),
                createdTimestamp: 500
            }
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                user: { displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png') },
                ws: { ping: 100 },
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                translate: jest.fn().mockImplementation((locale, key, value) => key)
            };

            await pingCommand.execute(interaction, client);
            expect(interaction.deferReply).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({
                embeds: expect.any(Array)
            }));
        });

        it('should handle fetch failure correctly', async () => {
            global.fetch = jest.fn().mockImplementation(() => Promise.resolve({ ok: false }));

            const interaction = {
                user: { id: '000000000000000000', username: 'test-user' },
                deferReply: jest.fn().mockResolvedValue({ createdTimestamp: 1000 }),
                editReply: jest.fn(),
                createdTimestamp: 500
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                user: { displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png') },
                ws: { ping: 100 },
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'ping.response.ping':
                            return 'Pinging...';
                        case 'ping.response.title':
                            return 'Pong!';
                        case 'ping.response.fields.bot_latency.name':
                            return 'Bot Latency';
                        case 'ping.response.fields.bot_latency.value':
                            return '100ms';
                        case 'ping.response.fields.api.discord.name':
                            return 'Discord API';
                        case 'ping.response.fields.api.discord.value':
                            return '100ms';
                        case 'ping.response.fields.api.mangadex.name':
                            return 'MangaDex API';
                        case 'ping.response.fields.api.namicomi.name':
                            return 'NamiComi API';
                        case 'ping.response.not_ok':
                            return 'Fetch failed';
                        case 'ping.response.footer':
                            return '/ping - Requested by test-user';
                        default:
                            return 'Fetch failed';
                    }
                })
            };

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error

            await pingCommand.execute(interaction, client);

            expect(interaction.deferReply).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalled();
            expect(client.translate).toHaveBeenCalledWith('en', 'commands', 'ping.response.not_ok');
            expect(interaction.editReply).toHaveBeenCalled();

            expect(console.error).toHaveBeenCalledTimes(2);
            expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error));
            expect(console.error).toHaveBeenNthCalledWith(2, expect.any(Error));

            consoleErrorSpy.mockRestore();
        });
    });
});