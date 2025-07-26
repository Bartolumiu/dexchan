const { EmbedBuilder } = require("discord.js");
const { Colors } = require("discord.js");
jest.mock("../../../src/functions/titles/titleStats", () => jest.fn());

describe('mangadex_stats', () => {
    let interaction, client, getTitleStats;

    beforeEach(() => {
        jest.clearAllMocks();
        
        getTitleStats = require("../../../src/functions/titles/titleStats");
        
        interaction = {
            deferUpdate: jest.fn().mockResolvedValue(),
            followUp: jest.fn().mockResolvedValue(),
            locale: 'es',
            customId: 'mangadex_stats_testTitle',
            message: {
                interaction: {
                    commandName: 'manga'
                }
            },
            user: { username: 'test' }
        };
        client = {
            getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
            translate: jest.fn((locale, category, key, params) => {
                const translations = {
                    'manga.response.stats.title': 'Manga Stats',
                    'manga.response.stats.description': 'Statistics for the manga.',
                    'manga.response.stats.fields.average.name': 'Average Rating',
                    'manga.response.stats.fields.bayesian.name': 'Bayesian Rating',
                    'manga.response.stats.fields.follows.name': 'Follows',
                    'manga.response.stats.fields.distribution.name': 'Rating Distribution',
                    'manga.response.stats.fields.comments.name': 'Comments',
                    'manga.response.stats.units.votes': 'votes',
                    'manga.response.footer': `Command: /{commandName}, User: {user}`.replace('{commandName}', interaction.message.interaction.commandName).replace('{user}', interaction.user.username),
                    'manga.response.error.title': 'Error',
                    'manga.response.error.description.api': 'Failed to fetch data from API.',
                    'manga.response.stats.buttons.forum.open': 'Open Forum',
                    'manga.response.stats.buttons.forum.no_thread': 'No Forum Thread'
                };
                return translations[key] || key;
            }),
            user: { avatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png') }
        };
        getTitleStats.mockResolvedValue({
            rating: {
                average: 8.5,
                bayesian: 8.0,
                distribution: { '1': 10, '2': 5, '3': 15, '4': 20, '5': 30, '6': 25, '7': 50, '8': 100, '9': 75, '10': 200 }
            },
            follows: 500
        });
    });

    it('should defer the interaction update', async () => {
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        expect(interaction.deferUpdate).toHaveBeenCalled();
    });

    it('should fetch user settings and locale', async () => {
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        expect(client.getMongoUserData).toHaveBeenCalledWith(interaction.user);
    });

    it('should translate the embed and error messages', async () => {
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        expect(client.translate).toHaveBeenCalled();
    });

    it('should return an error embed if stats are not found', async () => {
        getTitleStats.mockResolvedValue(null);
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        const embed = new EmbedBuilder()
            .setTitle('Error')
            .setDescription('Failed to fetch data from API.')
            .setFooter({ text: 'Command: /manga, User: test', iconURL: 'https://example.com/avatar.png' })
            .setColor(Colors.Red);
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [embed],
            ephemeral: true
        });
    });

    it('should format and send the stats embed correctly', async () => {
        getTitleStats.mockResolvedValue({
            rating: {
                average: 8.5,
                bayesian: 8.0,
                distribution: { '1': 10, '2': 5, '3': 15, '4': 20, '5': 30, '6': 25, '7': 50, '8': 100, '9': 75, '10': 200 }
            },
            follows: 500
        });
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        const stats = {
            rating: {
                average: 8.5,
                bayesian: 8.0,
                distribution: { '1': 10, '2': 5, '3': 15, '4': 20, '5': 30, '6': 25, '7': 50, '8': 100, '9': 75, '10': 200 }
            },
            follows: 500
        };
        
        const totalVotes = Object.values(stats.rating.distribution).reduce((total, count) => total + count, 0);
        
        const embed = new EmbedBuilder()
            .setTitle('Manga Stats')
            .setDescription('Statistics for the manga.')
            .addFields(
                { name: 'Average Rating', value: `${stats.rating.average.toFixed(2)}/10.00 (${totalVotes} votes)`, inline: true },
                { name: 'Bayesian Rating', value: `${stats.rating.bayesian.toFixed(2)}/10.00`, inline: true },
                { name: 'Follows', value: `${stats.follows}`, inline: true },
                { name: 'Rating Distribution', value: Object.entries(stats.rating.distribution).reverse().filter(([, count]) => count > 0).map(([rating, count]) => `${rating}/10: \`${count}\` · (${(count / totalVotes * 100).toFixed(2)}%)`).join('\n'), inline: true },
                { name: 'Comments', value: '0', inline: true }
            )
            .setFooter({ text: 'Command: /manga, User: test', iconURL: 'https://example.com/avatar.png' })
            .setColor(Colors.Blurple);
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [embed],
            components: expect.any(Array)
        });
    });

    it('should return null for invalid customId format', async () => {
        interaction.customId = 'invalid_format';
        const result = await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        expect(result).toBeNull();
    });

    it('should handle missing or malformed rating data gracefully', async () => {
        getTitleStats.mockResolvedValue({
            // Missing rating data
            follows: 100
        });
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: expect.arrayContaining([
                expect.objectContaining({
                    data: expect.objectContaining({
                        fields: expect.arrayContaining([
                            expect.objectContaining({
                                name: 'Average Rating',
                                value: '0/10.00 (0 votes)'
                            }),
                            expect.objectContaining({
                                name: 'Bayesian Rating', 
                                value: '0/10.00'
                            }),
                            expect.objectContaining({
                                name: 'Rating Distribution',
                                value: 'N/A'
                            })
                        ])
                    })
                })
            ]),
            components: expect.any(Array)
        });
    });

    it('should handle empty distribution data', async () => {
        getTitleStats.mockResolvedValue({
            rating: {
                average: null,
                bayesian: undefined,
                distribution: {}
            },
            follows: 0
        });
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: expect.arrayContaining([
                expect.objectContaining({
                    data: expect.objectContaining({
                        fields: expect.arrayContaining([
                            expect.objectContaining({
                                name: 'Rating Distribution',
                                value: 'N/A'
                            })
                        ])
                    })
                })
            ]),
            components: expect.any(Array)
        });
    });

    it('should include forum thread button when threadId is available', async () => {
        getTitleStats.mockResolvedValue({
            rating: {
                average: 8.5,
                bayesian: 8.0,
                distribution: { '1': 10, '2': 5, '3': 15, '4': 20, '5': 30, '6': 25, '7': 50, '8': 100, '9': 75, '10': 200 }
            },
            follows: 500,
            comments: {
                threadId: '123456',
                repliesCount: 42
            }
        });
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);
        
        // The interaction should be called with components that include a forum button
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: expect.any(Array),
            components: expect.arrayContaining([
                expect.objectContaining({
                    components: expect.arrayContaining([
                        expect.objectContaining({
                            data: expect.objectContaining({
                                label: 'Open Forum',
                                url: 'https://forums.mangadex.org/threads/123456',
                                style: 5 // ButtonStyle.Link
                            })
                        })
                    ])
                })
            ])
        });
    });

    it('should use interaction.locale when userSettings.preferredLocale is not set', async () => {
        client.getMongoUserData.mockResolvedValue({ preferredLocale: null });
        await require("../../../src/components/buttons/mangadex_stats").execute(interaction, client);

        expect(client.translate).toHaveBeenNthCalledWith(1, 'es', 'commands', 'manga.response.stats.title');
        expect(client.translate).toHaveBeenNthCalledWith(2, 'es', 'commands', 'manga.response.stats.description');
        expect(client.translate).toHaveBeenNthCalledWith(3, 'es', 'commands', 'manga.response.stats.fields.average.name');
        expect(client.translate).toHaveBeenNthCalledWith(4, 'es', 'commands', 'manga.response.stats.fields.bayesian.name');
        expect(client.translate).toHaveBeenNthCalledWith(5, 'es', 'commands', 'manga.response.stats.fields.follows.name');
        expect(client.translate).toHaveBeenNthCalledWith(6, 'es', 'commands', 'manga.response.stats.fields.distribution.name');
        expect(client.translate).toHaveBeenNthCalledWith(7, 'es', 'commands', 'manga.response.stats.fields.comments.name');
        expect(client.translate).toHaveBeenNthCalledWith(8, 'es', 'commands', 'manga.response.stats.units.votes');
        expect(client.translate).toHaveBeenNthCalledWith(9, 'es', 'commands', 'manga.response.footer', {
            commandName: `/${interaction.message.interaction.commandName}`,
            user: interaction.user.username
        });
        expect(client.translate).toHaveBeenNthCalledWith(10, 'es', 'commands', 'manga.response.error.title');
        expect(client.translate).toHaveBeenNthCalledWith(11, 'es', 'commands', 'manga.response.error.description.api');
        expect(client.translate).toHaveBeenNthCalledWith(12, 'es', 'commands', 'manga.response.stats.buttons.forum.open');
        expect(client.translate).toHaveBeenNthCalledWith(13, 'es', 'commands', 'manga.response.stats.buttons.forum.no_thread');
    });
});
