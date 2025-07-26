const { SlashCommandBuilder, InteractionType } = require('discord.js');
const namiCommand = require('../../../src/commands/namicomi/nami');

jest.mock('../../../src/functions/handlers/handleLocales', () => ({
    translateAttribute: jest.fn().mockResolvedValue({ 'en-GB': 'translated string' })
}));

jest.mock('../../../src/functions/titles/titleSearch', () => 
    jest.fn().mockResolvedValue(new Map([['Test Title', 'test-id-123']]))
);

jest.mock('../../../src/functions/titles/titleDetails', () => 
    jest.fn().mockResolvedValue({
        id: 'test-id-123',
        attributes: {
            title: { en: 'Test Title' },
            description: { en: 'Test description' }
        }
    })
);

jest.mock('../../../src/functions/titles/titleStats', () => 
    jest.fn().mockResolvedValue({
        statistics: {
            rating: { average: 8.5 },
            follows: 1000
        }
    })
);

jest.mock('../../../src/functions/parsers/urlParser', () => ({
    parseURL: jest.fn().mockResolvedValue('test-id-123'),
    checkID: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../src/functions/titles/titleEmbed', () => 
    jest.fn().mockReturnValue({
        type: 1,
        components: []
    })
);

jest.mock('../../../src/functions/titles/errorEmbed', () => 
    jest.fn().mockResolvedValue()
);

jest.mock('../../../src/functions/titles/setImages', () => 
    jest.fn().mockResolvedValue([])
);

jest.mock('../../../src/functions/titles/titleListEmbed', () => 
    jest.fn().mockReturnValue({
        type: 1,
        components: []
    })
);

describe('nami command', () => {
    // Helper function to create mock interaction
    const createMockInteraction = (optionsMap = {}) => ({
        type: InteractionType.ApplicationCommand,
        commandName: 'nami',
        options: {
            getString: jest.fn((option) => optionsMap[option] || null)
        },
        user: { username: 'testUser' },
        deferred: false,
        replied: false,
        deferReply: jest.fn().mockResolvedValue(),
        editReply: jest.fn().mockResolvedValue(),
    });

    // Helper function to create mock client
    const createMockClient = () => ({
        translate: jest.fn().mockReturnValue('translated string'),
        getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
        user: {
            displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('data', () => {
        it('should build the slash command with correct localizations', async () => {
            const command = new SlashCommandBuilder()
                .setName('nami')
                .setDescription('Search for a title on NamiComi')
                .setDescriptionLocalizations({
                    'en-GB': 'translated string'
                })
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('The title you want to search for')
                        .setRequired(false)
                        .setDescriptionLocalizations({
                            'en-GB': 'translated string'
                        })
                )
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the title you want to search for')
                        .setRequired(false)
                        .setDescriptionLocalizations({
                            'en-GB': 'translated string'
                        })
                )
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('The URL of the title you want to search for')
                        .setRequired(false)
                        .setDescriptionLocalizations({
                            'en-GB': 'translated string'
                        })
                );

            const commandData = await namiCommand.data();

            expect(commandData).toEqual(command);
        });
    });

    describe('execute', () => {
        let mockSearch, mockTitleListEmbed, mockSendErrorEmbed;

        beforeEach(() => {
            mockSearch = require('../../../src/functions/titles/titleSearch');
            mockTitleListEmbed = require('../../../src/functions/titles/titleListEmbed');
            mockSendErrorEmbed = require('../../../src/functions/titles/errorEmbed');
        });

        describe('with query parameter', () => {
            it('should search for title and return title list when results found', async () => {
                const mockSearchResults = new Map([
                    ['Test Title 1', 'test-id-1'],
                    ['Test Title 2', 'test-id-2']
                ]);
                mockSearch.mockResolvedValue(mockSearchResults);

                const mockComponent = {
                    type: 1,
                    components: [{
                        type: 3,
                        custom_id: 'namicomi_select',
                        options: []
                    }]
                };
                mockTitleListEmbed.mockReturnValue(mockComponent);

                const interaction = createMockInteraction({ query: 'test title' });
                const client = createMockClient();

                await namiCommand.execute(interaction, client);

                expect(mockSearch).toHaveBeenCalledWith('test title', 'namicomi', 'en');
                expect(mockTitleListEmbed).toHaveBeenCalledWith(
                    expect.anything(), // embed
                    expect.anything(), // translations
                    mockSearchResults,
                    'namicomi'
                );
                expect(interaction.editReply).toHaveBeenCalledWith({
                    embeds: [expect.anything()],
                    components: [mockComponent]
                });
            });

            it('should return error when no search results found', async () => {
                mockSearch.mockResolvedValue(null);

                const interaction = {
                    type: InteractionType.ApplicationCommand,
                    commandName: 'nami',
                    options: {
                        getString: jest.fn((option) => {
                            if (option === 'query') return 'nonexistent title';
                            return null;
                        })
                    },
                    user: { username: 'testUser' },
                    deferred: false,
                    replied: false,
                    deferReply: jest.fn().mockResolvedValue(),
                    editReply: jest.fn().mockResolvedValue(),
                };

                const client = {
                    translate: jest.fn().mockReturnValue('translated string'),
                    getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                    user: {
                        displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
                    }
                };

                await namiCommand.execute(interaction, client);

                expect(mockSearch).toHaveBeenCalledWith('nonexistent title', 'namicomi', 'en');
                expect(mockSendErrorEmbed).toHaveBeenCalledWith(
                    interaction,
                    expect.anything(), // translations
                    expect.anything(), // embed
                    'no_results'
                );
            });
        });

        describe('with id parameter', () => {
            it('should get title details by ID and return detailed embed', async () => {
                const mockGetTitleDetails = require('../../../src/functions/titles/titleDetails');
                const mockGetTitleStats = require('../../../src/functions/titles/titleStats');
                const mockBuildTitleEmbed = require('../../../src/functions/titles/titleEmbed');
                const mockSetImages = require('../../../src/functions/titles/setImages');
                const { checkID } = require('../../../src/functions/parsers/urlParser');

                checkID.mockResolvedValue(true);
                mockGetTitleDetails.mockResolvedValue({ id: 'test-id', attributes: { title: { en: 'Test Title' } } });
                mockGetTitleStats.mockResolvedValue({ statistics: { rating: { average: 8.5 } } });
                mockBuildTitleEmbed.mockReturnValue({ type: 1, components: [] });
                mockSetImages.mockResolvedValue([]);

                const interaction = {
                    type: InteractionType.ApplicationCommand,
                    commandName: 'nami',
                    options: {
                        getString: jest.fn((option) => {
                            if (option === 'id') return 'test-id-123';
                            return null;
                        })
                    },
                    user: { username: 'testUser' },
                    deferred: false,
                    replied: false,
                    deferReply: jest.fn().mockResolvedValue(),
                    editReply: jest.fn().mockResolvedValue(),
                };

                const client = {
                    translate: jest.fn().mockReturnValue('translated string'),
                    getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                    user: {
                        displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
                    }
                };

                await namiCommand.execute(interaction, client);

                expect(checkID).toHaveBeenCalledWith('test-id-123', 'namicomi');
                expect(mockGetTitleDetails).toHaveBeenCalledWith('test-id-123', 'namicomi');
                expect(mockGetTitleStats).toHaveBeenCalledWith('test-id-123', 'namicomi');
                expect(interaction.editReply).toHaveBeenCalledWith({
                    embeds: [expect.anything()],
                    files: [],
                    components: [expect.anything()]
                });
            });

            it('should handle MessageComponent interaction type and use reply instead of editReply', async () => {
                const mockGetTitleDetails = require('../../../src/functions/titles/titleDetails');
                const mockGetTitleStats = require('../../../src/functions/titles/titleStats');
                const mockBuildTitleEmbed = require('../../../src/functions/titles/titleEmbed');
                const mockSetImages = require('../../../src/functions/titles/setImages');
                const { checkID } = require('../../../src/functions/parsers/urlParser');

                checkID.mockResolvedValue(true);
                mockGetTitleDetails.mockResolvedValue({ id: 'test-id', attributes: { title: { en: 'Test Title' } } });
                mockGetTitleStats.mockResolvedValue({ statistics: { rating: { average: 8.5 } } });
                mockBuildTitleEmbed.mockReturnValue({ type: 1, components: [] });
                mockSetImages.mockResolvedValue([]);

                const interaction = {
                    type: InteractionType.MessageComponent, // Different interaction type
                    commandName: 'nami',
                    options: {
                        getString: jest.fn((option) => {
                            if (option === 'id') return 'test-id-123';
                            return null;
                        })
                    },
                    user: { username: 'testUser' },
                    deferred: false,
                    replied: false,
                    deferReply: jest.fn().mockResolvedValue(),
                    editReply: jest.fn().mockResolvedValue(),
                    reply: jest.fn().mockResolvedValue(), // Add reply method for MessageComponent
                };

                const client = {
                    translate: jest.fn().mockReturnValue('translated string'),
                    getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                    user: {
                        displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
                    }
                };

                await namiCommand.execute(interaction, client);

                expect(checkID).toHaveBeenCalledWith('test-id-123', 'namicomi');
                expect(mockGetTitleDetails).toHaveBeenCalledWith('test-id-123', 'namicomi');
                expect(mockGetTitleStats).toHaveBeenCalledWith('test-id-123', 'namicomi');
                expect(interaction.reply).toHaveBeenCalledWith({
                    embeds: [expect.anything()],
                    files: [],
                    components: [expect.anything()]
                });
                expect(interaction.editReply).not.toHaveBeenCalled(); // Should not call editReply for MessageComponent
            });
        });

        describe('with no parameters', () => {
            it('should return error when no parameters provided', async () => {
                const interaction = {
                    type: InteractionType.ApplicationCommand,
                    commandName: 'nami',
                    options: {
                        getString: jest.fn().mockReturnValue(null)
                    },
                    user: { username: 'testUser' },
                    deferred: false,
                    replied: false,
                    deferReply: jest.fn().mockResolvedValue(),
                    editReply: jest.fn().mockResolvedValue(),
                };

                const client = {
                    translate: jest.fn().mockReturnValue('translated string'),
                    getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                    user: {
                        displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
                    }
                };

                await namiCommand.execute(interaction, client);

                expect(mockSendErrorEmbed).toHaveBeenCalledWith(
                    interaction,
                    expect.anything(), // translations
                    expect.anything(), // embed
                    'empty'
                );
            });
        });

        describe('edge cases for code coverage', () => {
            it('should skip deferReply when interaction is already deferred', async () => {
                const interaction = createMockInteraction({ query: 'test title' });
                interaction.deferred = true; // Already deferred - covers line 46
                
                const client = createMockClient();
                // Mock for when userSettings.preferredLocale is null - covers line 49
                client.getMongoUserData.mockResolvedValue({ preferredLocale: null });

                const mockSearch = require('../../../src/functions/titles/titleSearch');
                const mockTitleListEmbed = require('../../../src/functions/titles/titleListEmbed');
                
                mockSearch.mockResolvedValue(new Map([['Test Title', 'test-id']]));
                mockTitleListEmbed.mockReturnValue({ type: 1, components: [] });

                await namiCommand.execute(interaction, client);

                // Should not call deferReply since interaction is already deferred
                expect(interaction.deferReply).not.toHaveBeenCalled();
                // Should use interaction.locale since preferredLocale is null
                expect(client.translate).toHaveBeenCalledWith(
                    interaction.locale, 
                    expect.any(String), 
                    expect.any(String)
                );
            });

            it('should skip deferReply when interaction is already replied', async () => {
                const interaction = createMockInteraction({ query: 'test title' });
                interaction.replied = true; // Already replied - covers line 46
                
                const client = createMockClient();

                const mockSearch = require('../../../src/functions/titles/titleSearch');
                const mockTitleListEmbed = require('../../../src/functions/titles/titleListEmbed');
                
                mockSearch.mockResolvedValue(new Map([['Test Title', 'test-id']]));
                mockTitleListEmbed.mockReturnValue({ type: 1, components: [] });

                await namiCommand.execute(interaction, client);

                // Should not call deferReply since interaction is already replied
                expect(interaction.deferReply).not.toHaveBeenCalled();
            });

            it('should use ID when query is null but ID is provided (covers line 141)', async () => {
                const mockGetTitleDetails = require('../../../src/functions/titles/titleDetails');
                const mockGetTitleStats = require('../../../src/functions/titles/titleStats');
                const mockBuildTitleEmbed = require('../../../src/functions/titles/titleEmbed');
                const mockSetImages = require('../../../src/functions/titles/setImages');
                const { checkID } = require('../../../src/functions/parsers/urlParser');

                // Mock specific parameter responses to test line 141: const titleID = id || await parseURL(url, 'namicomi');
                const interaction = {
                    type: InteractionType.ApplicationCommand,
                    commandName: 'nami',
                    options: {
                        getString: jest.fn((option) => {
                            if (option === 'query') return null; // Query is null
                            if (option === 'id') return 'test-title-id-123'; // ID is provided
                            if (option === 'url') return null; // URL is null
                            return null;
                        })
                    },
                    user: { username: 'testUser' },
                    deferred: false,
                    replied: false,
                    deferReply: jest.fn().mockResolvedValue(),
                    editReply: jest.fn().mockResolvedValue(),
                };

                const client = createMockClient();

                // Mock the functions
                checkID.mockResolvedValue(true);
                mockGetTitleDetails.mockResolvedValue({ id: 'test-title-id-123', attributes: { title: { en: 'Test Title from ID' } } });
                mockGetTitleStats.mockResolvedValue({ statistics: { rating: { average: 7.8 } } });
                mockBuildTitleEmbed.mockReturnValue({ type: 1, components: [] });
                mockSetImages.mockResolvedValue([]);

                await namiCommand.execute(interaction, client);

                // Verify that the ID path was taken (line 141: const titleID = id || await parseURL(url, 'namicomi');)
                expect(interaction.options.getString).toHaveBeenCalledWith('query');
                expect(interaction.options.getString).toHaveBeenCalledWith('id');
                expect(interaction.options.getString).toHaveBeenCalledWith('url');
                expect(checkID).toHaveBeenCalledWith('test-title-id-123', 'namicomi');
                expect(mockGetTitleDetails).toHaveBeenCalledWith('test-title-id-123', 'namicomi');
                expect(mockGetTitleStats).toHaveBeenCalledWith('test-title-id-123', 'namicomi');
            });

            it('should use URL when query and ID are null but URL is provided (covers parseURL in line 141)', async () => {
                const mockGetTitleDetails = require('../../../src/functions/titles/titleDetails');
                const mockGetTitleStats = require('../../../src/functions/titles/titleStats');
                const mockBuildTitleEmbed = require('../../../src/functions/titles/titleEmbed');
                const mockSetImages = require('../../../src/functions/titles/setImages');
                const { parseURL, checkID } = require('../../../src/functions/parsers/urlParser');

                // Mock specific parameter responses to test the parseURL part of line 141
                const interaction = {
                    type: InteractionType.ApplicationCommand,
                    commandName: 'nami',
                    options: {
                        getString: jest.fn((option) => {
                            if (option === 'query') return null; // Query is null
                            if (option === 'id') return null; // ID is also null
                            if (option === 'url') return 'https://namicomi.com/title/test-title-id-456'; // URL is provided
                            return null;
                        })
                    },
                    user: { username: 'testUser' },
                    deferred: false,
                    replied: false,
                    deferReply: jest.fn().mockResolvedValue(),
                    editReply: jest.fn().mockResolvedValue(),
                };

                const client = createMockClient();

                // Mock the functions
                parseURL.mockResolvedValue('test-title-id-456'); // parseURL extracts ID from URL
                checkID.mockResolvedValue(true);
                mockGetTitleDetails.mockResolvedValue({ id: 'test-title-id-456', attributes: { title: { en: 'Test Title from URL' } } });
                mockGetTitleStats.mockResolvedValue({ statistics: { rating: { average: 7.8 } } });
                mockBuildTitleEmbed.mockReturnValue({ type: 1, components: [] });
                mockSetImages.mockResolvedValue([]);

                await namiCommand.execute(interaction, client);

                // Verify that the URL path was taken (line 141: const titleID = id || await parseURL(url, 'namicomi');)
                expect(interaction.options.getString).toHaveBeenCalledWith('query');
                expect(interaction.options.getString).toHaveBeenCalledWith('id');
                expect(interaction.options.getString).toHaveBeenCalledWith('url');
                expect(parseURL).toHaveBeenCalledWith('https://namicomi.com/title/test-title-id-456', 'namicomi');
                expect(checkID).toHaveBeenCalledWith('test-title-id-456', 'namicomi');
                expect(mockGetTitleDetails).toHaveBeenCalledWith('test-title-id-456', 'namicomi');
                expect(mockGetTitleStats).toHaveBeenCalledWith('test-title-id-456', 'namicomi');
            });

            it('should handle invalid title ID (covers line 142)', async () => {
                const { checkID } = require('../../../src/functions/parsers/urlParser');

                const interaction = {
                    type: InteractionType.ApplicationCommand,
                    commandName: 'nami',
                    options: {
                        getString: jest.fn((option) => {
                            if (option === 'id') return 'invalid-title-id';
                            return null;
                        })
                    },
                    user: { username: 'testUser' },
                    deferred: false,
                    replied: false,
                    deferReply: jest.fn().mockResolvedValue(),
                    editReply: jest.fn().mockResolvedValue(),
                };

                const client = createMockClient();

                // Mock checkID to return false for invalid ID (line 142)
                checkID.mockResolvedValue(false);

                await namiCommand.execute(interaction, client);

                expect(checkID).toHaveBeenCalledWith('invalid-title-id', 'namicomi');
                expect(mockSendErrorEmbed).toHaveBeenCalledWith(
                    interaction,
                    expect.anything(), // translations
                    expect.anything(), // embed
                    'invalid_id'
                );
            });

            it('should handle null title or stats data (covers line 145)', async () => {
                const mockGetTitleDetails = require('../../../src/functions/titles/titleDetails');
                const mockGetTitleStats = require('../../../src/functions/titles/titleStats');
                const { checkID } = require('../../../src/functions/parsers/urlParser');

                const interaction = {
                    type: InteractionType.ApplicationCommand,
                    commandName: 'nami',
                    options: {
                        getString: jest.fn((option) => {
                            if (option === 'id') return 'valid-id-but-no-data';
                            return null;
                        })
                    },
                    user: { username: 'testUser' },
                    deferred: false,
                    replied: false,
                    deferReply: jest.fn().mockResolvedValue(),
                    editReply: jest.fn().mockResolvedValue(),
                };

                const client = createMockClient();

                // Mock checkID to return true, but getTitleDetails to return null (line 145)
                checkID.mockResolvedValue(true);
                mockGetTitleDetails.mockResolvedValue(null); // This should trigger the error on line 145
                mockGetTitleStats.mockResolvedValue({ statistics: { rating: { average: 7.5 } } });

                await namiCommand.execute(interaction, client);

                expect(checkID).toHaveBeenCalledWith('valid-id-but-no-data', 'namicomi');
                expect(mockGetTitleDetails).toHaveBeenCalledWith('valid-id-but-no-data', 'namicomi');
                expect(mockGetTitleStats).toHaveBeenCalledWith('valid-id-but-no-data', 'namicomi');
                expect(mockSendErrorEmbed).toHaveBeenCalledWith(
                    interaction,
                    expect.anything(), // translations
                    expect.anything(), // embed
                    'invalid_id'
                );
            });
        });
    });
});
