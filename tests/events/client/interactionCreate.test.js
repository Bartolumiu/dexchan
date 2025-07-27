const fs = require('fs');
const path = require('path');
const { execute } = require('../../../src/events/client/interactionCreate');
const { name } = require('../../../src/events/client/ready');

jest.mock('fs');

describe('interactionCreate event', () => {
    let interaction, client;

    beforeEach(() => {
        client = {
            commands: new Map(),
            buttons: new Map(),
            selectMenus: new Map(),
            modals: new Map(),
            translate: jest.fn().mockResolvedValue('translated text'),
            getMongoUserData: jest.fn().mockReturnValue(null),
            user: { displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png') }
        };

        interaction = {
            user: { tag: 'test-user', id: '000000000000000' },
            commandName: 'testCommand',
            customId: 'testCustomId',
            locale: 'en-US',
            isChatInputCommand: jest.fn().mockReturnValue(false),
            isButton: jest.fn().mockReturnValue(false),
            isAnySelectMenu: jest.fn().mockReturnValue(false),
            isContextMenuCommand: jest.fn().mockReturnValue(false),
            isModalSubmit: jest.fn().mockReturnValue(false),
            isAutocomplete: jest.fn().mockReturnValue(false),
            replied: false,
            deferred: false,
            reply: jest.fn(),
            followUp: jest.fn()
        };

        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should handle a chat input command interaction', async () => {
        interaction.isChatInputCommand.mockReturnValue(true);
        client.commands.set('testCommand', { execute: jest.fn() });

        await execute(interaction, client);

        expect(client.commands.get('testCommand').execute).toHaveBeenCalledWith(interaction, client);
    });

    it('should handle a button interaction', async () => {
        interaction.isButton.mockReturnValue(true);
        client.buttons.set('testCustomId', { execute: jest.fn() });

        await execute(interaction, client);

        expect(client.buttons.get('testCustomId').execute).toHaveBeenCalledWith(interaction, client);
    });

    it('should handle a select menu interaction', async () => {
        interaction.isAnySelectMenu.mockReturnValue(true);
        client.selectMenus.set('testCustomId', { execute: jest.fn() });

        await execute(interaction, client);

        expect(client.selectMenus.get('testCustomId').execute).toHaveBeenCalledWith(interaction, client);
    });

    it('should handle a context menu command interaction', async () => {
        interaction.isContextMenuCommand.mockReturnValue(true);
        client.commands.set('testCommand', { execute: jest.fn() });

        await execute(interaction, client);

        expect(client.commands.get('testCommand').execute).toHaveBeenCalledWith(interaction, client);
    });

    it('should handle a modal submit interaction', async () => {
        interaction.isModalSubmit.mockReturnValue(true);
        client.modals.set('testCustomId', { execute: jest.fn() });

        await execute(interaction, client);

        expect(client.modals.get('testCustomId').execute).toHaveBeenCalledWith(interaction, client);
    });

    it('should handle an autocomplete interaction', async () => {
        interaction.isAutocomplete.mockReturnValue(true);
        client.commands.set('testCommand', { autocomplete: jest.fn() });

        await execute(interaction, client);

        expect(client.commands.get('testCommand').autocomplete).toHaveBeenCalledWith(interaction, client);
    });

    it('should log an error and reply when an exception occurs', async () => {
        interaction.isChatInputCommand.mockReturnValue(true);
        client.commands.set('testCommand', { 
            execute: jest.fn().mockImplementation(() => {
                throw new Error('Test error');
            })
        });
    
        await execute(interaction, client);
    
        expect(fs.existsSync).toHaveBeenCalledWith('./logs');
        expect(fs.mkdirSync).toHaveBeenCalledWith('./logs', { recursive: true });
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('.txt'), 
            expect.stringContaining('Test error')
        );
    
        // Retrieve the argument with which interaction.reply was called.
        const replyArg = interaction.reply.mock.calls[0][0];
    
        // Assert on the overall structure.
        expect(replyArg).toEqual(
            expect.objectContaining({
                ephemeral: true,
                embeds: expect.any(Array)
            })
        );
    
        // Assert the first embed is exactly as expected.
        const [firstEmbed, secondEmbed] = replyArg.embeds;
        expect(firstEmbed).toEqual({
            data: {
                color: 15548997,
                description: 'translated text',
                fields: [
                    {
                        name: 'translated text',
                        value: 'Test error'
                    }
                ],
                footer: {
                    icon_url: 'https://example.com/avatar.png',
                    text: 'ERR_INT_CH_INPUT - translated text'
                },
                title: 'translated text'
            }
            });
        // Assert the second embed contains the error message.
        expect(secondEmbed.data.description).toContain('Error: Test error');
    });

    it('should follow up if interaction was already replied to', async () => {
        interaction.isChatInputCommand.mockReturnValue(true);
        interaction.replied = true;

        client.commands.set('testCommand', { execute: jest.fn().mockRejectedValue(new Error('Test error')) });

        await execute(interaction, client);

        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: expect.any(Array),
            ephemeral: true
        });
    });

    it('should warn when interaction type is unknown', async () => {
        interaction.isChatInputCommand.mockReturnValue(false);
        interaction.isButton.mockReturnValue(false);
        interaction.isAnySelectMenu.mockReturnValue(false);
        interaction.isContextMenuCommand.mockReturnValue(false);
        interaction.isModalSubmit.mockReturnValue(false);
        interaction.isAutocomplete.mockReturnValue(false);

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        await execute(interaction, client);

        expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown interaction type: undefined');

        consoleWarnSpy.mockRestore();
    });

    it('should handle regex keys in button customId', async () => {
        interaction.isButton.mockReturnValue(true);
        interaction.customId = 'nami_stats_2025';
    
        // Use an actual RegExp object as the key
        client.buttons.set(/^nami_stats_/, { execute: jest.fn() });
    
        await execute(interaction, client);
    
        const matched = [...client.buttons.entries()].find(([key]) => key instanceof RegExp && key.test(interaction.customId))?.[1];
        expect(matched.execute).toHaveBeenCalledWith(interaction, client);
    });
    
    it('should handle timeout errors gracefully', async () => {
        interaction.isChatInputCommand.mockReturnValue(true);
        client.commands.set('testCommand', { execute: jest.fn().mockRejectedValue(new Error('Timeout error')) });

        await execute(interaction, client);

        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: expect.any(Array),
            ephemeral: true
        });
    });

    it('should handle button errors gracefully', async () => {
        interaction.isButton.mockReturnValue(true);
        client.buttons.set('testButton', { execute: jest.fn().mockRejectedValue(new Error('Test error')) });
        fs.existsSync.mockReturnValue(true);

        await execute(interaction, client);

        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: expect.any(Array),
            ephemeral: true
        });
    });

    it('should handle select menu errors gracefully', async () => {
        interaction.isAnySelectMenu.mockReturnValue(true);
        client.selectMenus.set('testSelect', { execute: jest.fn().mockRejectedValue(new Error('Test error')) });
        fs.existsSync.mockReturnValue(true);

        await execute(interaction, client);

        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: expect.any(Array),
            ephemeral: true
        });
    });

    it('should handle context menu errors gracefully', async () => {
        interaction.isContextMenuCommand.mockReturnValue(true);
        client.commands.set('testCommand', { execute: jest.fn().mockRejectedValue(new Error('Test error')) });
        fs.existsSync.mockReturnValue(true);

        await execute(interaction, client);

        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: expect.any(Array),
            ephemeral: true
        });
    });

    it('should handle modal submit errors gracefully', async () => {
        interaction.isModalSubmit.mockReturnValue(true);
        client.modals.set('testModal', { execute: jest.fn().mockRejectedValue(new Error('Test error')) });
        fs.existsSync.mockReturnValue(true);

        await execute(interaction, client);

        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: expect.any(Array),
            ephemeral: true
        });
    });

    it('should handle autocomplete errors gracefully', async () => {
        interaction.isAutocomplete.mockReturnValue(true);
        client.commands.set('testCommand', { autocomplete: jest.fn().mockRejectedValue(new Error('Test error')) });
        fs.existsSync.mockReturnValue(true);

        await execute(interaction, client);

        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: expect.any(Array),
            ephemeral: true
        });
    });

    it('should handle unknown interaction types gracefully', async () => {
        interaction.isChatInputCommand.mockReturnValue(false);
        interaction.isButton.mockReturnValue(false);
        interaction.isAnySelectMenu.mockReturnValue(false);
        interaction.isContextMenuCommand.mockReturnValue(false);
        interaction.isModalSubmit.mockReturnValue(false);
        interaction.isAutocomplete.mockReturnValue(false);

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        await execute(interaction, client);

        expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown interaction type: undefined');

        consoleWarnSpy.mockRestore();
    });
    
    it('should set "Unknown" as error origin if customId and commandName are not available', async () => {
        interaction.isChatInputCommand.mockReturnValue(true);
        interaction.isButton.mockReturnValue(false);
        interaction.isAnySelectMenu.mockReturnValue(false);
        interaction.isContextMenuCommand.mockReturnValue(false);
        interaction.isModalSubmit.mockReturnValue(false);
        interaction.isAutocomplete.mockReturnValue(false);
        interaction.customId = null;
        interaction.commandName = null;

        client.commands.set('testCommand', { execute: jest.fn().mockRejectedValue(new Error('Test error')) });

        await execute(interaction, client);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('.txt'), 
            expect.stringContaining('Unknown')
        );
    });
});