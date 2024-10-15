const { EmbedBuilder, Colors } = require('discord.js');
const { execute } = require('../../../src/commands/utils/help');
const translateAttribute = require('../../../src/functions/handlers/translateAttribute');

// Mock the translation function
jest.mock('../../../src/functions/handlers/translateAttribute');

describe('help command', () => {
    let interaction;
    let client;

    beforeEach(() => {
        interaction = {
            user: {
                id: 'user-id',
                username: 'test-user'
            },
            locale: 'en-US',
            reply: jest.fn(),
            commandName: 'help'
        };

        client = {
            getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
            translate: jest.fn(),
            user: {
                displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar-url')
            }
        };

        // Mock translations for the help command
        client.translate
            // Title
            .mockResolvedValueOnce('Help')

            // Fields
            // Commands
            .mockResolvedValueOnce('Commands')
            .mockResolvedValueOnce('To view a list of commands, use `/commands`.')

            // Support
            .mockResolvedValueOnce('Support')
            .mockResolvedValueOnce('To get support, use `/support`.')

            // Invite
            .mockResolvedValueOnce('Invite')
            .mockResolvedValueOnce('To invite the bot to your server, use `/invite`.')

            // Stats
            .mockResolvedValueOnce('Stats')
            .mockResolvedValueOnce('To view the bot\'s stats, use `/stats`.')

            // Uptime
            .mockResolvedValueOnce('Uptime')
            .mockResolvedValueOnce('To view the bot\'s uptime, use `/uptime`.')

            // Footer
            .mockResolvedValueOnce('/help - Requested by test-user');

        translateAttribute.mockResolvedValue('Help description');
    });

    test('should send a help embed', async () => {
        await execute(interaction, client);

        expect(client.getMongoUserData).toHaveBeenCalledWith(interaction.user);
        expect(client.translate).toHaveBeenCalledTimes(12);

        const embed = interaction.reply.mock.calls[0][0].embeds[0];

        expect(embed).toBeInstanceOf(EmbedBuilder);
        expect(embed.data.title).toBe('Help');
        expect(embed.data.color).toBe(Colors.Blurple);
        expect(embed.data.footer.text).toBe(`/${interaction.commandName} - Requested by ${interaction.user.username}`);

        // Verify the fields
        expect(embed.data.fields).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'Commands', value: 'To view a list of commands, use `/commands`.' }),
            expect.objectContaining({ name: 'Support', value: 'To get support, use `/support`.' }),
            expect.objectContaining({ name: 'Invite', value: 'To invite the bot to your server, use `/invite`.' }),
            expect.objectContaining({ name: 'Stats', value: 'To view the bot\'s stats, use `/stats`.' }),
            expect.objectContaining({ name: 'Uptime', value: 'To view the bot\'s uptime, use `/uptime`.' })
        ]));
    });
});
