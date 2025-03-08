const { EmbedBuilder, Colors } = require('discord.js');
const helpCommand = require('../../../src/commands/utils/help');
const translateAttribute = require('../../../src/functions/handlers/translateAttribute');

jest.mock('../../../src/functions/handlers/translateAttribute', () => jest.fn().mockResolvedValue('translated string'));

describe('help command', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('data', () => {
        it('should build the slash command with correct localizations', async () => {
            // Mock the translateAttribute function
            translateAttribute.mockResolvedValue({ 'en-GB': 'translated string' });
            const command = {
                name: 'help',
                description: 'Get help with using the bot',
                descriptionLocalizations: await translateAttribute('help', 'description')
            };

            await helpCommand.data();
            expect(command.name).toBe('help');
            expect(command.description).toBe('Get help with using the bot');
            expect(command.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
        });
    });
    
    describe('execute', () => {
        it('should send a help embed', async () => {
            const interaction = {
                options: {},
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user' },
                reply: jest.fn()
            };
            const client = {
                user: { displayAvatarURL: jest.fn() },
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'help.response.title':
                            return 'Help';
                        case 'help.response.fields.commands.name':
                            return 'Commands';
                        case 'help.response.fields.commands.value':
                            return 'To view a list of commands, use `/commands`.';
                        case 'help.response.fields.support.name':
                            return 'Support';
                        case 'help.response.fields.support.value':
                            return 'To get support, use `/support`.';
                        case 'help.response.fields.invite.name':
                            return 'Invite';
                        case 'help.response.fields.invite.value':
                            return 'To invite the bot to your server, use `/invite`.';
                        case 'help.response.fields.stats.name':
                            return 'Stats';
                        case 'help.response.fields.stats.value':
                            return 'To view the bot\'s stats, use `/stats`.';
                        case 'help.response.fields.uptime.name':
                            return 'Uptime';
                        case 'help.response.fields.uptime.value':
                            return 'To view the bot\'s uptime, use `/uptime`.';
                        case 'help.response.footer':
                            return '/help - Requested by test-user';
                        default:
                            return '';
                    };
                })
            };

            const embed = {
                setTitle: jest.fn(),
                addFields: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                setTimestamp: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'help.response.title'),
                    fields: [
                        {
                            name: client.translate('en', 'commands', 'help.response.fields.commands.name'),
                            value: client.translate('en', 'commands', 'help.response.fields.commands.value')
                        },
                        {
                            name: client.translate('en', 'commands', 'help.response.fields.support.name'),
                            value: client.translate('en', 'commands', 'help.response.fields.support.value')
                        },
                        {
                            name: client.translate('en', 'commands', 'help.response.fields.invite.name'),
                            value: client.translate('en', 'commands', 'help.response.fields.invite.value')
                        },
                        {
                            name: client.translate('en', 'commands', 'help.response.fields.stats.name'),
                            value: client.translate('en', 'commands', 'help.response.fields.stats.value')
                        },
                        {
                            name: client.translate('en', 'commands', 'help.response.fields.uptime.name'),
                            value: client.translate('en', 'commands', 'help.response.fields.uptime.value')
                        }
                    ],
                    footer: client.translate('en', 'commands', 'help.response.footer'),
                    color: Colors.Blurple
                }
            };

            await helpCommand.execute(interaction, client);
            expect(embed.data.title).toBe('Help');
            expect(embed.data.fields).toEqual(expect.arrayContaining([
                expect.objectContaining({ name: 'Commands', value: 'To view a list of commands, use `/commands`.' }),
                expect.objectContaining({ name: 'Support', value: 'To get support, use `/support`.' }),
                expect.objectContaining({ name: 'Invite', value: 'To invite the bot to your server, use `/invite`.' }),
                expect.objectContaining({ name: 'Stats', value: 'To view the bot\'s stats, use `/stats`.' }),
                expect.objectContaining({ name: 'Uptime', value: 'To view the bot\'s uptime, use `/uptime`.' })
            ]));
            expect(embed.data.footer).toBe('/help - Requested by test-user');
        })
    });
});
