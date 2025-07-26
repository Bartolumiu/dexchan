const { EmbedBuilder } = require("discord.js");
const { Colors } = require("discord.js");

// Mock the getTitleStats function before requiring the module
jest.mock("../../../src/functions/titles/titleStats", () => jest.fn());

describe('namicomi_stats', () => {
    let interaction, client, getTitleStats;

    beforeEach(() => {
        // Clear module cache to ensure fresh mock
        jest.clearAllMocks();
        
        getTitleStats = require("../../../src/functions/titles/titleStats");
        
        interaction = {
            deferUpdate: jest.fn().mockResolvedValue(),
            followUp: jest.fn().mockResolvedValue(),
            locale: 'es',
            customId: 'namicomi_stats_testTitle',
            message: {
                interaction: {
                    commandName: 'nami'
                }
            },
            user: { username: 'test' }
        };
        client = {
            getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
            translate: jest.fn((locale, category, key, params) => {
                const translations = {
                    'nami.response.stats.title': 'Namicomi Stats',
                    'nami.response.stats.description': 'Statistics for the title.',
                    'nami.response.stats.fields.rating.name': 'Rating',
                    'nami.response.stats.fields.views.name': 'Views',
                    'nami.response.stats.fields.follows.name': 'Follows',
                    'nami.response.stats.fields.comments.name': 'Comments',
                    'nami.response.stats.fields.chapterViews.name': 'Chapter Views',
                    'nami.response.stats.fields.chapterComments.name': 'Chapter Comments',
                    'nami.response.stats.fields.chapterReactions.name': 'Chapter Reactions',
                    'nami.response.stats.units.votes': 'votes',
                    'nami.response.footer': `Command: /{commandName}, User: {user}`.replace('{commandName}', interaction.message.interaction.commandName).replace('{user}', interaction.user.username)
                };
                return translations[key] || key;
            }),
            user: { 
                avatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png'),
                displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
            }
        };
        
        // Set up default mock return value
        getTitleStats.mockResolvedValue({
            title: {
                rating: {
                    bayesian: 4.5,
                    count: 150
                },
                views: 25000,
                follows: 1200,
                comments: {
                    repliesCount: 45
                }
            },
            chapters: {
                views: 150000,
                comments: 320,
                reactions: 89
            }
        });
    });

    it('should defer the interaction update', async () => {
        await require("../../../src/components/buttons/namicomi_stats").execute(interaction, client);
        expect(interaction.deferUpdate).toHaveBeenCalled();
    });

    it('should fetch user settings and locale', async () => {
        await require("../../../src/components/buttons/namicomi_stats").execute(interaction, client);
        expect(client.getMongoUserData).toHaveBeenCalledWith(interaction.user);
    });

    it('should translate the embed messages', async () => {
        await require("../../../src/components/buttons/namicomi_stats").execute(interaction, client);
        expect(client.translate).toHaveBeenCalled();
    });

    it('should use interaction locale when user has no preferred locale', async () => {
        client.getMongoUserData.mockResolvedValue({}); // No preferredLocale set
        await require("../../../src/components/buttons/namicomi_stats").execute(interaction, client);
        expect(client.translate).toHaveBeenCalled();
        // The translation should be called with the interaction's locale ('es')
        expect(client.translate).toHaveBeenCalledWith('es', expect.any(String), expect.any(String), expect.any(Object));
    });

    it('should return null for invalid customId format', async () => {
        interaction.customId = 'invalid_format';
        const result = await require("../../../src/components/buttons/namicomi_stats").execute(interaction, client);
        expect(result).toBeNull();
    });

    it('should return an error embed if stats are not found', async () => {
        getTitleStats.mockResolvedValue(null);
        await require("../../../src/components/buttons/namicomi_stats").execute(interaction, client);
        const embed = new EmbedBuilder()
            .setTitle('Namicomi Stats')
            .setDescription('Statistics for the title.')
            .setFooter({ text: 'Command: /nami, User: test', iconURL: 'https://example.com/avatar.png' })
            .setColor(Colors.Red);
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [embed],
            ephemeral: true
        });
    });

    it('should format and send the stats embed correctly', async () => {
        getTitleStats.mockResolvedValue({
            title: {
                rating: {
                    bayesian: 4.5,
                    count: 150
                },
                views: 25000,
                follows: 1200,
                comments: {
                    repliesCount: 45
                }
            },
            chapters: {
                views: 150000,
                comments: 320,
                reactions: 89
            }
        });
        await require("../../../src/components/buttons/namicomi_stats").execute(interaction, client);
        
        const embed = new EmbedBuilder()
            .setTitle('Namicomi Stats')
            .setDescription('Statistics for the title.')
            .addFields(
                { name: 'Rating', value: '4.50/5.00 (150 votes)', inline: true },
                { name: 'Views', value: '25000', inline: true },
                { name: 'Follows', value: '1200', inline: true },
                { name: 'Comments', value: '45', inline: true },
                { name: 'Chapter Views', value: '150000', inline: true },
                { name: 'Chapter Comments', value: '320', inline: true },
                { name: 'Chapter Reactions', value: '89', inline: true }
            )
            .setFooter({ text: 'Command: /nami, User: test', iconURL: 'https://example.com/avatar.png' })
            .setColor(Colors.Blurple);
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [embed]
        });
    });

    it('should handle missing rating data gracefully', async () => {
        getTitleStats.mockResolvedValue({
            title: {
                rating: {
                    bayesian: 0,
                    count: 0
                },
                views: 0,
                follows: 0,
                comments: {
                    repliesCount: 0
                }
            },
            chapters: {
                views: 0,
                comments: 0,
                reactions: 0
            }
        });
        
        await require("../../../src/components/buttons/namicomi_stats").execute(interaction, client);
        
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: expect.arrayContaining([
                expect.objectContaining({
                    data: expect.objectContaining({
                        fields: expect.arrayContaining([
                            expect.objectContaining({
                                name: 'Rating',
                                value: '0.00/5.00 (0 votes)'
                            }),
                            expect.objectContaining({
                                name: 'Views',
                                value: '0'
                            }),
                            expect.objectContaining({
                                name: 'Follows',
                                value: '0'
                            }),
                            expect.objectContaining({
                                name: 'Comments',
                                value: '0'
                            }),
                            expect.objectContaining({
                                name: 'Chapter Views',
                                value: '0'
                            }),
                            expect.objectContaining({
                                name: 'Chapter Comments',
                                value: '0'
                            }),
                            expect.objectContaining({
                                name: 'Chapter Reactions',
                                value: '0'
                            })
                        ])
                    })
                })
            ])
        });
    });
});
