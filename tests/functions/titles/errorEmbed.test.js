const sendErrorEmbed = require('../../../src/functions/titles/errorEmbed');
const { Colors, InteractionType } = require('discord.js');

describe('sendErrorEmbed', () => {
    let interaction;
    let embed;
    let translations;

    beforeEach(() => {
        embed = {
            setTitle: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            setColor: jest.fn().mockReturnThis(),
        };
        translations = {
            embed: {
                error: {
                    title: 'Error!',
                    description: {
                        api: 'API error',
                        test: 'Test error',
                    },
                },
            },
        };
    });

    it('should return early if embed is null', async () => {
        embed = null;
        await sendErrorEmbed(interaction, translations, embed, 'test');
        expect(embed).toBeNull();
    })

    it('should call editReply for normal interaction', async () => {
        interaction = {
            type: 4, // Not InteractionType.MessageComponent
            editReply: jest.fn(),
        };
        await sendErrorEmbed(interaction, translations, embed, 'test');
        expect(embed.setTitle).toHaveBeenCalledWith('Error!');
        expect(embed.setDescription).toHaveBeenCalledWith('Test error');
        expect(embed.setColor).toHaveBeenCalledWith(Colors.Red);
        expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [embed], ephemeral: true });
    });

    it('should call reply for MessageComponent interaction and use api error description', async () => {
        interaction = {
            type: InteractionType.MessageComponent,
            reply: jest.fn(),
        };
        await sendErrorEmbed(interaction, translations, embed, 'test');
        expect(embed.setTitle).toHaveBeenCalledWith('Error!');
        expect(embed.setDescription).toHaveBeenCalledWith('API error');
        expect(embed.setColor).toHaveBeenCalledWith(Colors.Red);
        expect(interaction.reply).toHaveBeenCalledWith({ embeds: [embed], ephemeral: true });
    });
});
