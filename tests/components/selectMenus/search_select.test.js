const { StringSelectMenuBuilder } = require('discord.js');
const searchSelect = require('../../../src/components/selectMenus/search_select');

describe('search_select', () => {
    let interaction, client, command;

    beforeEach(() => {
        command = {
            execute: jest.fn().mockResolvedValue(),
        };
        client = {
            commands: new Map([['search', command]]),
        };

        interaction = {
            deferUpdate: jest.fn().mockResolvedValue(),
            editReply: jest.fn().mockResolvedValue(),
            values: ['mangadex:123'],
            component: new StringSelectMenuBuilder().setCustomId('search_select'),
            options: {
                getString: jest.fn((name) => {
                    switch (name) {
                        case 'id':
                            return '123';
                        case 'source':
                            return 'mangadex';
                        default:
                            return null;
                    }
                }),
            },
        };
    });

    it('should defer the update and return early if the command does not exist', async () => {
        client.commands.delete('search');

        await searchSelect.execute(interaction, client);

        expect(interaction.deferUpdate).toHaveBeenCalled();
        expect(command.execute).not.toHaveBeenCalled();
    });

    it('should disable the select menu if it is a StringSelectMenuBuilder', async () => {
        await searchSelect.execute(interaction, client);

        expect(interaction.editReply).toHaveBeenCalledWith({
            components: [expect.any(StringSelectMenuBuilder)]
        });
        expect(interaction.component.data.disabled).toBe(true);
    });

    it('should remove components if the select menu is not a StringSelectMenuBuilder', async () => {
        interaction.component = { custom_id: 'search_select' };
        await searchSelect.execute(interaction, client);

        expect(interaction.editReply).toHaveBeenCalledWith({ components: [] });
    });

    it('should correctly split the value into source and id and pass them to the command', async () => {
        await searchSelect.execute(interaction, client);

        const mockInteraction = command.execute.mock.calls[0][0];
        expect(mockInteraction.options.getString('source')).toBe('mangadex');
        expect(mockInteraction.options.getString('id')).toBe('123');
        expect(mockInteraction.options.getString('other')).toBeNull();
    });

    it('should redirect mockInteraction.reply to interaction.editReply', async () => {
        await searchSelect.execute(interaction, client);

        const mockInteraction = command.execute.mock.calls[0][0];
        const testPayload = { content: 'Test Success'}

        await mockInteraction.reply(testPayload);
        expect(interaction.editReply).toHaveBeenCalledWith(testPayload);
    });
})