const { Colors } = require('discord.js');
const pingCommand = require('../../../src/commands/utils/ping');
const { translateAttribute, getLocale } = require('../../../src/functions/handlers/handleLocales');

jest.mock('../../../src/functions/handlers/handleLocales', () => ({
    translateAttribute: jest.fn().mockResolvedValue({ 'en-GB': 'translated string' }),
}));

jest.mock('../../../src/commands/utils/ping', () => ({
    ...jest.requireActual('../../../src/commands/utils/ping'),
    getPing: jest.fn()
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
            pingCommand.getPing.mockResolvedValue(100);

            await pingCommand.data();
            expect(command.name).toBe('ping');
            expect(command.description).toBe('Check the bot\'s latency');
            expect(command.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
        });
    });

    describe('execute', () => {
        it('should send a ping embed', async () => {
            global.fetch = jest.fn().mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({
                data: { ping: 100 }
            })}))
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
            pingCommand.getPing.mockResolvedValue(100);


            await pingCommand.execute(interaction, client);
            expect(interaction.deferReply).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({
                embeds: expect.any(Array)
            }));
        });

        it('should handle fetch failure correctly', async () => {
            global.fetch = jest.fn().mockImplementation((url) => {
                if (url === 'https://api.mangadex.org/ping' || url === 'https://api.namicomi.com/ping') {
                    return Promise.resolve({ ok: false });
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve({
                    data: { ping: 100 }
                })});
            });
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
            const embed = {
                setTitle: jest.fn(),
                addFields: jest.fn(),
                setFooter: jest.fn(),
                setColor: jest.fn(),
                setTimestamp: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'ping.response.title'),
                    fields: [
                        {
                            name: client.translate('en', 'commands', 'ping.response.fields.bot_latency.name'),
                            value: client.translate('en', 'commands', 'ping.response.fields.bot_latency.value'),
                            inline: true
                        },
                        {
                            name: client.translate('en', 'commands', 'ping.response.fields.api.discord.name'),
                            value: client.translate('en', 'commands', 'ping.response.fields.api.discord.value'),
                            inline: true
                        },
                        {
                            name: client.translate('en', 'commands', 'ping.response.fields.api.mangadex.name'),
                            value: client.translate('en', 'commands', 'ping.response.not_ok'),
                            inline: true
                        },
                        {
                            name: client.translate('en', 'commands', 'ping.response.fields.api.namicomi.name'),
                            value: client.translate('en', 'commands', 'ping.response.not_ok'),
                            inline: true
                        }
                    ],
                    footer: {
                        icon_url: 'https://example.com/avatar.png',
                        text: client.translate('en', 'commands', 'ping.response.footer')
                    },
                    color: Colors.Blurple
                }
            };
            console.error = jest.fn(); // Suppress console.error

            pingCommand.getPing.mockRejectedValue(new Error('Fetch failed'));

            await pingCommand.execute(interaction, client);

            expect(interaction.deferReply).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalled();
            expect(client.translate).toHaveBeenCalledWith('en', 'commands', 'ping.response.not_ok');
            expect(interaction.editReply).toHaveBeenCalled();

            expect(console.error).toHaveBeenCalledTimes(2);
            expect(console.error).toHaveBeenNthCalledWith(
                1,
                expect.any(Error),
            );
            expect(console.error).toHaveBeenNthCalledWith(
                2,
                expect.any(Error),
            );
        });
    });
});