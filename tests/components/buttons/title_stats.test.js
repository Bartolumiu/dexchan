const { EmbedBuilder, Colors, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { MessageFlags } = require("discord-api-types/v10");

// Mock the getTitleStats function
jest.mock("../../../src/functions/titles/titleStats", () => jest.fn());

describe('title_stats component', () => {
    let interaction, client, getTitleStats;

    beforeEach(() => {
        jest.clearAllMocks();
        getTitleStats = require("../../../src/functions/titles/titleStats");

        // Mock interaction
        interaction = {
            deferUpdate: jest.fn().mockResolvedValue(),
            followUp: jest.fn().mockResolvedValue(),
            customId: 'mangadex_title_stats_12345',
            user: { username: 'testuser' },
            locale: 'en-US'
        };

        // Mock client
        client = {
            getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
            getTranslations: jest.fn((locale, category, key) => {
                const translations = {
                    'components': {
                        'title_stats': {
                            response: {
                                title: 'Statistics',
                                description: 'Stats for {titleId} on {source}',
                                footer: 'Requested by {user}',
                                fields: {
                                    average: { name: 'Average' },
                                    bayesian: { name: 'Bayesian' },
                                    rating: { name: 'Rating' },
                                    follows: { name: 'Follows' },
                                    distribution: { name: 'Distribution' },
                                    comments: { name: 'Comments' },
                                    views: { name: 'Views' },
                                    chapter_views: { name: 'Ch. Views' },
                                    chapter_comments: { name: 'Ch. Comments' },
                                    chapter_reactions: { name: 'Ch. Reactions' }
                                },
                                units: { votes: 'votes' },
                                buttons: {
                                    mangadex: {
                                        forum: { open: 'Open', no_thread: 'No Thread' }
                                    }
                                }
                            },
                            error: {
                                title: 'Error',
                                description: 'Could not fetch stats'
                            }
                        }
                    },
                    'generic': {
                        'sources': {
                            mangadex: 'MangaDex',
                            namicomi: 'NamiComi'
                        }
                    }
                };
                return translations[category] ? translations[category][key] : null;
            }),
            user: {
                avatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
            }
        };
    });

    const execute = async () => {
        const titleStats = require("../../../src/components/buttons/title_stats");
        await titleStats.execute(interaction, client);
    };

    it('should correctly parse source and entryId from regex customId', async () => {
        interaction.customId = 'namicomi_title_stats_my-manga-id';
        getTitleStats.mockResolvedValue({
            title: { rating: { bayesian: 4.5, count: 10 }, comments: { repliesCount: 5 }, follows: 10, views: 100 },
            chapters: { views: 50, comments: 2, reactions: 1 }
        });

        await execute();

        expect(getTitleStats).toHaveBeenCalledWith('my-manga-id', 'namicomi');
    });

    it('should return null and do nothing if customId does not match regex', async () => {
        interaction.customId = 'invalid_id_format';
        const titleStats = require("../../../src/components/buttons/title_stats");
        const result = await titleStats.execute(interaction, client);

        expect(result).toBeNull();
        expect(interaction.deferUpdate).toHaveBeenCalled();
        expect(getTitleStats).not.toHaveBeenCalled();
    });

    it('should send an ephemeral error embed if getTitleStats returns null', async () => {
        getTitleStats.mockResolvedValue(null);

        await execute();

        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [expect.objectContaining({
                data: expect.objectContaining({
                    title: 'Error',
                    color: Colors.Red
                })
            })],
            flags: [MessageFlags.Ephemeral]
        });
    });

    describe('Source Specific Formatting', () => {
        it('should format MangaDex fields and buttons correctly', async () => {
            interaction.customId = 'mangadex_title_stats_md123';
            getTitleStats.mockResolvedValue({
                title: {
                    rating: { average: 8.5, bayesian: 8.2, count: 100, distribution: { '10': 50, '9': 50 } },
                    follows: 500,
                    comments: { repliesCount: 10, threadId: 'thread_abc' }
                }
            });

            await execute();

            const followUpCall = interaction.followUp.mock.calls[0][0];
            const embed = followUpCall.embeds[0].data;

            expect(embed.title).toBe('Statistics');
            // Check MD specific field (Bayesian)
            expect(embed.fields).toContainEqual(expect.objectContaining({ name: 'Bayesian', value: '8.2/10.00' }));
            // Check button logic
            expect(followUpCall.components[0].components[0].data.url).toContain('thread_abc');
        });

        it('should format NamiComi fields correctly', async () => {
            interaction.customId = 'namicomi_title_stats_nc123';
            getTitleStats.mockResolvedValue({
                title: {
                    rating: { bayesian: 4.85, count: 20 },
                    follows: 150,
                    views: 1000,
                    comments: { repliesCount: 5 }
                },
                chapters: { views: 500, comments: 20, reactions: 30 }
            });

            await execute();

            const embed = interaction.followUp.mock.calls[0][0].embeds[0].data;
            // NamiComi rating is out of 5
            expect(embed.fields).toContainEqual(expect.objectContaining({ name: 'Rating', value: '4.85/5.00 (20 votes)' }));
            // Check chapter stats unique to NamiComi
            expect(embed.fields).toContainEqual(expect.objectContaining({ name: 'Ch. Views', value: '500' }));
        });
    });

    it('should handle MangaDex titles with no forum thread by disabling the button', async () => {
        interaction.customId = 'mangadex_title_stats_no_thread';
        getTitleStats.mockResolvedValue({
            title: {
                rating: { average: 5, bayesian: 5, count: 1, distribution: { '5': 1 } },
                follows: 1,
                comments: { repliesCount: 0, threadId: null }
            }
        });

        await execute();

        const components = interaction.followUp.mock.calls[0][0].components[0];
        expect(components.components[0].data.disabled).toBe(true);
        expect(components.components[0].data.label).toBe('No Thread');
    });

    it('should handle empty distributions by showing N/A', async () => {
        interaction.customId = 'mangadex_title_stats_empty';
        getTitleStats.mockResolvedValue({
            title: {
                rating: { average: 0, bayesian: 0, count: 0, distribution: {} },
                follows: 0,
                comments: { repliesCount: 0 }
            }
        });

        await execute();

        const embed = interaction.followUp.mock.calls[0][0].embeds[0].data;
        const distField = embed.fields.find(f => f.name === 'Distribution');
        expect(distField.value).toBe('N/A');
    });
});