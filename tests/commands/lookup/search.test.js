const { SlashCommandBuilder, InteractionType } = require('discord.js');
const searchCommand = require('../../../src/commands/lookup/search');

// --- Mocks ---
jest.mock('../../../src/functions/handlers/handleLocales', () => ({
    translateAttribute: jest.fn().mockResolvedValue({ 'en-GB': 'translated string' }),
    getLocale: jest.fn().mockReturnValue('en')
}));
jest.mock('../../../src/functions/titles/titleSearch', () => jest.fn());
jest.mock('../../../src/functions/titles/titleDetails', () => jest.fn());
jest.mock('../../../src/functions/titles/titleStats', () => jest.fn());
jest.mock('../../../src/functions/parsers/urlParser', () => ({
    parseURL: jest.fn(),
    checkID: jest.fn()
}));
jest.mock('../../../src/functions/titles/titleEmbed', () => jest.fn().mockReturnValue({ type: 1, components: [] }));
jest.mock('../../../src/functions/titles/errorEmbed', () => jest.fn().mockResolvedValue());
jest.mock('../../../src/functions/titles/setImages', () => jest.fn().mockResolvedValue([]));
jest.mock('../../../src/functions/titles/titleListEmbed', () => jest.fn().mockReturnValue({ type: 1, components: [] }));

describe('/search command', () => {
    // Helper function to create mock interaction
    const createMockInteraction = (optionsMap = {}, type = InteractionType.ApplicationCommand) => ({
        type: type,
        commandName: 'search',
        options: {
            getString: jest.fn((option) => optionsMap[option] !== undefined ? optionsMap[option] : null)
        },
        user: { username: 'testUser' },
        deferred: false,
        replied: false,
        deferReply: jest.fn().mockResolvedValue(),
        editReply: jest.fn().mockResolvedValue(),
        reply: jest.fn().mockResolvedValue(),
        respond: jest.fn().mockResolvedValue(),
        deferUpdate: jest.fn().mockResolvedValue()
    });

    // Helper function to create mock client
    const createMockClient = (botSettingsOverride = {}) => ({
        getTranslations: jest.fn((locale, category, key) => {
            if (category === 'commands' && key === 'search') return {
                response: { footer: 'Footer {commandName} {user}' },
                options: { source: { values: { mangadex: 'MangaDex', namicomi: 'NamiComi' } } }
            };
            if (category === 'generic' && key === 'sources') return { mangadex: 'MangaDex', namicomi: 'NamiComi' };
            return {};
        }),
        getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
        getMongoBotData: jest.fn().mockResolvedValue({
            settings: {
                commands: [{ name: 'search', enabled: true }],
                sources: [
                    { name: 'mangadex', enabled: true },
                    { name: 'namicomi', enabled: false } // Disabled source for testing
                ],
                ...botSettingsOverride.settings
            }
        }),
        user: { displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png') }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('data', () => {
        it('should build the slash command with autocomplete source and correct localizations', async () => {
            const commandData = await searchCommand.data();
            expect(commandData.name).toBe('search');
            expect(commandData.options).toHaveLength(4);

            // Verify source option is required and autocomplete enabled
            const sourceOption = commandData.options.find(opt => opt.name === 'source');
            expect(sourceOption.autocomplete).toBe(true);
            expect(sourceOption.required).toBe(true);
        });
    });

    describe('autocomplete', () => {
        it('should return all enabled sources when there is no input', async () => {
            const interaction = createMockInteraction({ source: null });
            const client = createMockClient();

            await searchCommand.autocomplete(interaction, client);

            // NamiComi is disabled in the mock, so only MangaDex should return
            expect(interaction.respond).toHaveBeenCalledWith([
                { name: 'MangaDex', value: 'mangadex' }
            ]);
        });

        it('should filter sources based on user input', async () => {
            const interaction = createMockInteraction({ source: 'dex' });
            const client = createMockClient();

            await searchCommand.autocomplete(interaction, client);

            expect(interaction.respond).toHaveBeenCalledWith([
                { name: 'MangaDex', value: 'mangadex' }
            ]);
        });

        it('should return an empty array if no sources match', async () => {
            const interaction = createMockInteraction({ source: 'nonexistent' });
            const client = createMockClient();

            await searchCommand.autocomplete(interaction, client);

            expect(interaction.respond).toHaveBeenCalledWith([]);
        });

        it('should return an empty array if there are no sources configured', async () => {
            const interaction = createMockInteraction({ source: 'nothing' });
            const client = createMockClient({ settings: { sources: [] } });

            await searchCommand.autocomplete(interaction, client);

            expect(interaction.respond).toHaveBeenCalledWith([]);
        })
    });

    describe('execute', () => {
        let mockSearch, mockSendErrorEmbed, mockGetTitleDetails, mockGetTitleStats;
        const { checkID, parseURL } = require('../../../src/functions/parsers/urlParser');

        beforeEach(() => {
            mockSearch = require('../../../src/functions/titles/titleSearch');
            mockSendErrorEmbed = require('../../../src/functions/titles/errorEmbed');
            mockGetTitleDetails = require('../../../src/functions/titles/titleDetails');
            mockGetTitleStats = require('../../../src/functions/titles/titleStats');
        });

        describe('pre-execution checks & validation', () => {
            it('should send an error if the command is disabled globally', async () => {
                const interaction = createMockInteraction({ source: 'mangadex', query: 'test' });
                // Override bot settings to disable search
                const client = createMockClient({ settings: { commands: [{ name: 'search', enabled: false }] } });

                await searchCommand.execute(interaction, client);

                expect(mockSendErrorEmbed).toHaveBeenCalledWith(interaction, expect.anything(), expect.anything(), 'command_disabled');
            });

            it('should send an error if no source is provided', async () => {
                const interaction = createMockInteraction({ source: null });
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(mockSendErrorEmbed).toHaveBeenCalledWith(interaction, expect.anything(), expect.anything(), 'no_source');
            });

            it('should send an error if the source is disabled or invalid', async () => {
                const interaction = createMockInteraction({ source: 'namicomi' }); // namicomi is disabled in mock
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(mockSendErrorEmbed).toHaveBeenCalledWith(interaction, expect.anything(), expect.anything(), 'invalid_source', { source: 'namicomi' });
            });

            it('should send an error if query, id, and url are all missing', async () => {
                const interaction = createMockInteraction({ source: 'mangadex', query: null, id: null, url: null });
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(mockSendErrorEmbed).toHaveBeenCalledWith(interaction, expect.anything(), expect.anything(), 'empty');
            });
        });

        describe('with query parameter', () => {
            it('should search and return title list when results are found', async () => {
                mockSearch.mockResolvedValue(new Map([['Test Title', '123']]));

                const interaction = createMockInteraction({ source: 'mangadex', query: 'test manga' });
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(mockSearch).toHaveBeenCalledWith('test manga', 'mangadex');
                expect(interaction.editReply).toHaveBeenCalledWith({
                    embeds: [expect.anything()],
                    components: [expect.anything()]
                });
            });

            it('should return error when no search results found', async () => {
                mockSearch.mockResolvedValue(null);

                const interaction = createMockInteraction({ source: 'mangadex', query: 'nonexistent' });
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(mockSendErrorEmbed).toHaveBeenCalledWith(interaction, expect.anything(), expect.anything(), 'no_results');
            });
        });

        describe('with id/url parameter', () => {
            beforeEach(() => {
                checkID.mockResolvedValue(true);
                mockGetTitleDetails.mockResolvedValue({ id: '123', title: 'Test' });
                mockGetTitleStats.mockResolvedValue({ rating: 10 });
            });

            it('should fetch details by ID and return full embed', async () => {
                const interaction = createMockInteraction({ source: 'mangadex', id: '123' });
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(checkID).toHaveBeenCalledWith('123', 'mangadex');
                expect(mockGetTitleDetails).toHaveBeenCalledWith('123', 'mangadex');
                expect(interaction.editReply).toHaveBeenCalled();
            });

            it('should parse URL if ID is not provided', async () => {
                parseURL.mockResolvedValue('parsed-id-456');
                const interaction = createMockInteraction({ source: 'mangadex', url: 'https://mangadex.org/title/parsed-id-456' });
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(parseURL).toHaveBeenCalledWith('https://mangadex.org/title/parsed-id-456', 'mangadex');
                expect(checkID).toHaveBeenCalledWith('parsed-id-456', 'mangadex');
            });

            it('should handle invalid IDs', async () => {
                checkID.mockResolvedValue(false);
                const interaction = createMockInteraction({ source: 'mangadex', id: 'invalid' });
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(mockSendErrorEmbed).toHaveBeenCalledWith(interaction, expect.anything(), expect.anything(), 'invalid_id');
            });

            it('should handle missing entry or stats data', async () => {
                mockGetTitleStats.mockResolvedValue(null); // Force a failure on stats fetching
                const interaction = createMockInteraction({ source: 'mangadex', id: '123' });
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(mockSendErrorEmbed).toHaveBeenCalledWith(interaction, expect.anything(), expect.anything(), 'invalid_id');
            });

            it('should use reply instead of editReply for MessageComponent interaction types', async () => {
                const interaction = createMockInteraction({ source: 'mangadex', id: '123' }, InteractionType.MessageComponent);
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(interaction.reply).toHaveBeenCalled();
                expect(interaction.editReply).not.toHaveBeenCalled();
            });
        });

        describe('deferReply edge cases', () => {
            it('should skip deferReply when interaction is already deferred', async () => {
                const interaction = createMockInteraction({ source: 'mangadex', query: 'test' });
                interaction.deferred = true; // Force skip
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(interaction.deferReply).not.toHaveBeenCalled();
            });

            it('should skip deferReply when interaction is already replied', async () => {
                const interaction = createMockInteraction({ source: 'mangadex', query: 'test' });
                interaction.replied = true; // Force skip
                const client = createMockClient();

                await searchCommand.execute(interaction, client);

                expect(interaction.deferReply).not.toHaveBeenCalled();
            });
        });

        describe('fallbacks', () => {
            it('should fallback to raw source name in execute when translation is missing', async () => {
                const interaction = createMockInteraction({ source: 'mangadex', query: 'test' });
                const client = createMockClient();

                const mockSearch = require('../../../src/functions/titles/titleSearch');
                mockSearch.mockResolvedValue(new Map([['Test Title', '123']]));

                client.getTranslations.mockImplementation((locale, category, key) => {
                    if (category === 'commands') {
                        return { response: { footer: 'Footer {commandName} {user}' } };
                    }
                    return {};
                });

                await searchCommand.execute(interaction, client);

                expect(interaction.editReply).toHaveBeenCalled();
            });

            it('should fallback to raw source name in autocomplete when translation is missing', async () => {
                const interaction = createMockInteraction({ source: null });
                const client = createMockClient();

                // Force translations to be empty
                client.getTranslations.mockResolvedValue({});

                await searchCommand.autocomplete(interaction, client);

                // Because the translation is missing, it should fallback to the raw 'mangadex' string
                expect(interaction.respond).toHaveBeenCalledWith([
                    { name: 'mangadex', value: 'mangadex' }
                ]);
            });
        })
    });
});