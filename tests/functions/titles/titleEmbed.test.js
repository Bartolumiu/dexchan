const { Colors, ButtonBuilder } = require('discord.js');
const buildTitleEmbed = require('../../../src/functions/titles/titleEmbed');
const getLocalizedTitle = require('../../../src/functions/titles/localizedTitle');
const getLocalizedDescription = require('../../../src/functions/titles/localizedDescription');

jest.mock('../../../src/functions/titles/localizedTitle');
jest.mock('../../../src/functions/titles/localizedDescription');

describe('buildTitleEmbed', () => {
    let embed;
    let translations;
    let locale;
    beforeEach(() => {
        embed = {
            setTitle: jest.fn().mockReturnThis(),
            setURL: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addFields: jest.fn().mockReturnThis(),
            setColor: jest.fn().mockReturnThis(),
        };
        locale = 'en';
        translations = {
            response: {
                button: {
                    open: 'Open on {source}',
                    stats: 'View Stats'
                },
                menu: {
                    title: 'Search Results',
                    description: 'Here are the search results for `{query}` on {source}.',
                    placeholder: 'Select a title to view more information...',
                    view: 'View Title on {source}'
                },
                error: {
                    title: 'Uh-oh!',
                    description: {
                        command_disabled: 'This command is currently disabled.\nPlease try again later.',
                        invalid_source: 'We don\'t support searching on `{source}` yet. Please choose a different source.',
                        api: 'Couldn\'t fetch title data from the external API.\nPlease try again later.',
                        empty: 'Please provie a query to search for.',
                        no_results: 'The query returned no results. That\'s all we know.',
                        invalid_id: 'The provided ID is invalid.'
                    }
                },
                embed: {
                    author: {
                        too_many: 'Multiple Authors',
                        unknown: 'Unknown Author'
                    },
                    description: {
                        no_description: 'No description available for {locale}.'
                    },
                    fields: {
                        rating: 'Rating',
                        follows: 'Follows',
                        year: 'Year',
                        pub_status: {
                            name: 'Publication Status',
                            value: {
                                upcoming: 'Upcoming',
                                ongoing: 'Ongoing',
                                completed: 'Completed',
                                hiatus: 'Hiatus',
                                cancelled: 'Cancelled',
                                unknown: 'Unknown'
                            }
                        },
                        demographic: {
                            name: 'Demographic',
                            value: {
                                none: 'None',
                                shounen: 'Shounen',
                                shoujo: 'Shoujo',
                                seinen: 'Seinen',
                                josei: 'Josei'
                            }
                        },
                        content_rating: {
                            name: 'Content Rating',
                            value: {
                                safe: 'Safe',
                                suggestive: 'Suggestive',
                                erotica: 'Erotica',
                                pornographic: 'Pornographic',
                                mature: 'Mature',
                                restricted: 'Restricted'
                            }
                        },
                        type: {
                            name: 'Type',
                            value: {
                                manga: 'Manga',
                                long_strip: 'Long Strip',
                                comic: 'Comic',
                                novel: 'Novel'
                            }
                        },
                        reading_mode: {
                            name: 'Reading Mode',
                            value: {
                                vertical: 'Vertical',
                                horizontal: {
                                    left_to_right: 'Horizontal (Left to Right)',
                                    right_to_left: 'Horizontal (Right to Left)',
                                }
                            }
                        },
                        format: 'Format',
                        genres: 'Genres',
                        genres_v2: 'Genres (v2)',
                        tags: 'Tags',
                        tags_v2: 'Tags (v2)',
                        themes: 'Themes',
                        content_warning: 'Content Warning',
                        other_tags: 'Other Tags'
                    }
                },
                footer: '/{commandName} - Requested by {user}'
            },
            sources: {
                mangabaka: 'MangaBaka',
                mangadex: 'MangaDex',
                namicomi: 'NamiComi'
            }
        };

        ButtonBuilder.prototype.setLabel = jest.fn().mockReturnThis();
        ButtonBuilder.prototype.setURL = jest.fn().mockReturnThis();
        ButtonBuilder.prototype.setStyle = jest.fn().mockReturnThis();
        ButtonBuilder.prototype.setCustomId = jest.fn().mockReturnThis();
        ButtonBuilder.prototype.setEmoji = jest.fn().mockReturnThis();
        ButtonBuilder.prototype.setDisabled = jest.fn().mockReturnThis();

        getLocalizedTitle.mockReset();
        getLocalizedDescription.mockReset();
    });

    it('should return null for unknown type', () => {
        const title = { id: 'x', attributes: { title: { en: 'X' } } };
        const stats = {};
        const result = buildTitleEmbed(embed, locale, title, stats, translations, 'unknown');
        expect(result).toBeNull();
    });

    describe('MangaBaka', () => {
        it('should build a MangaBaka embed with all the fields', () => {
            const title = { id: 'mb', rating: 7.5, year: 2025, status: 'hiatus', content_rating: 'safe', tags: [] };
            getLocalizedTitle.mockReturnValue('Manga');
            getLocalizedDescription.mockReturnValue('desc');
            buildTitleEmbed(embed, locale, title, title, translations, 'mangabaka');
            expect(embed.addFields).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Demographic', value: 'N/A' })
                ])
            );
        });

        it('should display "N/A" for missing rating in MangaBaka', () => {
            const title = { id: 'mb-norating', year: 2025, status: 'hiatus', content_rating: 'safe', tags: [] };
            getLocalizedTitle.mockReturnValue('No Rating Manga');
            getLocalizedDescription.mockReturnValue('desc');
            buildTitleEmbed(embed, locale, title, title, translations, 'mangabaka');
            expect(embed.addFields).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Rating', value: 'N/A' })
                ])
            );
        });

        it('should handle unknown content rating values correctly in MangaBaka', () => {
            const title = { id: 'mb-norating', year: 2025, status: 'hiatus', content_rating: 'value', tags: [] };
            getLocalizedTitle.mockReturnValue('No Rating Manga');
            getLocalizedDescription.mockReturnValue('desc');
            buildTitleEmbed(embed, locale, title, title, translations, 'mangabaka');
            expect(embed.addFields).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Content Rating', value: 'Value' })
                ])
            );
        });
    });

    describe('MangaDex', () => {
        it('should use N/A for demographic if publicationDemographic is missing in MangaDex', () => {
            const title = {
                id: 'md-nodem',
                attributes: {
                    title: { en: 'No Demographic Manga' },
                    year: 2027,
                    status: 'ongoing',
                    // publicationDemographic is missing
                    contentRating: 'safe',
                    tags: []
                }
            };
            const stats = {
                rating: { bayesian: 7.7 },
                follows: 77
            };
            getLocalizedTitle.mockReturnValue('No Demographic Manga');
            getLocalizedDescription.mockReturnValue('desc');
            buildTitleEmbed(embed, locale, title, stats, translations, 'mangadex');
            expect(embed.addFields).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Demographic', value: 'N/A' })
                ])
            );
        });

        it('should use fallback description for MangaDex if missing', () => {
            const title = {
                id: 'mdesc',
                attributes: {
                    title: { en: 'No Desc Manga' },
                    year: 2024,
                    status: 'ongoing',
                    publicationDemographic: 'shounen',
                    contentRating: 'safe',
                    tags: []
                }
            };
            const stats = {
                rating: { bayesian: 9.1 },
                follows: 42
            };
            getLocalizedTitle.mockReturnValue('No Desc Manga');
            getLocalizedDescription.mockReturnValue(undefined);
            buildTitleEmbed(embed, locale, title, stats, translations, 'mangadex');
            expect(embed.setDescription).toHaveBeenCalledWith('No description available.');
        });

        it('should use raw status/demographic/contentRating if translation missing for MangaDex', () => {
            const title = {
                id: 'mdraw',
                attributes: {
                    title: { en: 'Raw Manga' },
                    year: 2025,
                    status: 'weirdstatus',
                    publicationDemographic: 'unknown',
                    contentRating: 'mature',
                    tags: []
                }
            };
            const stats = {
                rating: { bayesian: 5.5 },
                follows: 7
            };
            // Remove translation values
            translations.embed.fields.pub_status.value = {};
            translations.embed.fields.demographic.value = {};
            translations.embed.fields.content_rating.value = {};
            getLocalizedTitle.mockReturnValue('Raw Manga');
            getLocalizedDescription.mockReturnValue('desc');
            buildTitleEmbed(embed, locale, title, stats, translations, 'mangadex');
            // Should fallback to raw values
            expect(embed.addFields).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Status', value: 'Weirdstatus' }),
                    expect.objectContaining({ name: 'Demographic', value: 'Unknown' }),
                    expect.objectContaining({ name: 'Content Rating', value: 'Mature' })
                ])
            );
        });

        it('should build a MangaDex embed with all fields', () => {
            const title = {
                id: '1234',
                attributes: {
                    title: { en: 'Test Manga' },
                    year: 2020,
                    status: 'ongoing',
                    publicationDemographic: 'shounen',
                    contentRating: 'safe',
                    tags: [
                        { attributes: { group: 'genre', name: { en: 'Action' } } },
                        { attributes: { group: 'theme', name: { en: 'Fantasy' } } }
                    ]
                }
            };
            const stats = {
                rating: { bayesian: 8.5 },
                follows: 1000
            };
            getLocalizedTitle.mockReturnValue('Test Manga');
            getLocalizedDescription.mockReturnValue('A test manga description.');

            buildTitleEmbed(embed, locale, title, stats, translations, 'mangadex');

            expect(embed.setTitle).toHaveBeenCalledWith('Test Manga');
            expect(embed.setURL).toHaveBeenCalled();
            expect(embed.setDescription).toHaveBeenCalledWith('A test manga description.');
            expect(embed.addFields).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Rating', value: expect.any(String) }),
                    expect.objectContaining({ name: 'Follows', value: expect.any(String) }),
                    expect.objectContaining({ name: 'Year', value: expect.any(String) }),
                    expect.objectContaining({ name: 'Status', value: expect.any(String) }),
                    expect.objectContaining({ name: 'Demographic', value: expect.any(String) }),
                    expect.objectContaining({ name: 'Content Rating', value: expect.any(String) })
                ])
            );
            expect(embed.setColor).toHaveBeenCalledWith(Colors.Blurple);
        });

        it('should use fallback description if too long or missing', () => {
            const title = {
                id: '5678',
                attributes: {
                    title: { en: 'Long Desc Manga' },
                    year: 2021,
                    status: 'completed',
                    publicationDemographic: 'shounen',
                    contentRating: 'safe',
                    tags: [
                        { attributes: { group: 'genre', name: { en: 'Drama' } } }
                    ]
                }
            };
            const stats = {
                rating: { bayesian: 7.2 },
                follows: 500
            };
            getLocalizedTitle.mockReturnValue('Long Desc Manga');
            // Simulate a too-long description
            getLocalizedDescription.mockReturnValue('a'.repeat(5000));

            buildTitleEmbed(embed, locale, title, stats, translations, 'mangadex');
            // Should use fallback (truncated description with ellipsis)
            expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('(...)'));
        });

        it('should handle null/undefined description gracefully', () => {
            const title = {
                id: 'test-null',
                attributes: {
                    title: { en: 'Test Title' },
                    year: 2024,
                    status: 'ongoing',
                    publicationDemographic: 'shounen',
                    contentRating: 'safe',
                    tags: []
                }
            };
            const stats = {
                rating: { bayesian: 8.0 },
                follows: 100
            };

            getLocalizedTitle.mockReturnValue('Test Title');
            getLocalizedDescription.mockReturnValue(null); // Test null case

            expect(() => buildTitleEmbed(embed, locale, title, stats, translations, 'mangadex')).not.toThrow();

            getLocalizedDescription.mockReturnValue(undefined); // Test undefined case
            expect(() => buildTitleEmbed(embed, locale, title, stats, translations, 'mangadex')).not.toThrow();
        });

        it('should handle non-string inputs in sanitizeDescription', () => {
            // We need to access sanitizeDescription directly, but it's not exported
            // So we'll test it through the main function by bypassing the fallback
            const title = {
                id: 'test-nonstring',
                attributes: {
                    title: { en: 'Test Title' },
                    year: 2024,
                    status: 'ongoing',
                    publicationDemographic: 'shounen',
                    contentRating: 'safe',
                    tags: []
                }
            };
            const stats = {
                rating: { bayesian: 8.0 },
                follows: 100
            };

            // Mock translations to have a non-string fallback
            const testTranslations = {
                ...translations,
                embed: {
                    ...translations.embed,
                    error: {
                        no_description: 123 // Non-string value
                    }
                }
            };

            getLocalizedTitle.mockReturnValue('Test Title');
            getLocalizedDescription.mockReturnValue(null); // This will trigger the fallback

            // This should handle the non-string fallback gracefully
            expect(() => buildTitleEmbed(embed, locale, title, stats, testTranslations, 'mangadex')).not.toThrow();

            // Test with different non-string types
            testTranslations.embed.error.no_description = false;
            expect(() => buildTitleEmbed(embed, locale, title, stats, testTranslations, 'mangadex')).not.toThrow();

            testTranslations.embed.error.no_description = [];
            expect(() => buildTitleEmbed(embed, locale, title, stats, testTranslations, 'mangadex')).not.toThrow();
        });
    });

    describe('NamiComi', () => {
        it('should use fallback description for NamiComi if missing', () => {
            const title = {
                id: 'nami-nodesc',
                attributes: {
                    title: { en: 'No Desc Nami' },
                    year: 2028,
                    publicationStatus: 'ongoing',
                    demographic: 'shounen',
                    contentRating: 'safe',
                    tags: [],
                    readingMode: 'vls'
                },
                relationships: []
            };
            const stats = {
                title: {
                    rating: { bayesian: 8.8 },
                    follows: 88
                }
            };
            getLocalizedTitle.mockReturnValue('No Desc Nami');
            getLocalizedDescription.mockReturnValue(undefined);
            buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
            expect(embed.setDescription).toHaveBeenCalledWith('No description available.');
        });

        it('should use N/A for demographic if missing in NamiComi', () => {
            const title = {
                id: 'nami-nodem',
                attributes: {
                    title: { en: 'No Demographic Nami' },
                    year: 2029,
                    publicationStatus: 'ongoing',
                    // demographic is missing
                    contentRating: 'safe',
                    tags: [],
                    readingMode: 'vls'
                },
                relationships: []
            };
            const stats = {
                title: {
                    rating: { bayesian: 3.3 },
                    follows: 33
                }
            };
            getLocalizedTitle.mockReturnValue('No Demographic Nami');
            getLocalizedDescription.mockReturnValue('desc');
            buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
            expect(embed.addFields).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Demographic', value: 'N/A' })
                ])
            );
        });

        it('should use raw pub_status/demographic/contentRating if translation missing for NamiComi', () => {
            const title = {
                id: 'nami-raw',
                attributes: {
                    title: { en: 'Raw Nami' },
                    description: { en: 'desc' },
                    year: 2026,
                    publicationStatus: 'strange',
                    demographic: 'odd',
                    contentRating: 'weird',
                    tags: [],
                    readingMode: 'vls'
                },
                relationships: []
            };
            const stats = {
                title: {
                    rating: { bayesian: 4.2 },
                    follows: 1
                }
            };
            // Remove translation values
            translations.response.embed.fields.pub_status.value = {};
            translations.response.embed.fields.demographic.value = {};
            translations.response.embed.fields.content_rating.value = {};
            getLocalizedTitle.mockReturnValue('Raw Nami');
            getLocalizedDescription.mockReturnValue('desc');
            buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
            expect(embed.addFields).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Status', value: 'Strange' }),
                    expect.objectContaining({ name: 'Demographic', value: 'Odd' }),
                    expect.objectContaining({ name: 'Content Rating', value: 'Weird' })
                ])
            );
        });

        it('should truncate NamiComi description if too long', () => {
            const title = {
                id: 'nami2',
                attributes: {
                    title: { en: 'Nami Longdesc' },
                    description: { en: 'desc' },
                    year: 2023,
                    publicationStatus: 'ongoing',
                    demographic: 'shounen',
                    contentRating: 'safe',
                    tags: [
                        { attributes: { group: 'genre', name: { en: 'Romance' } } }
                    ],
                    readingMode: 'vls'
                },
                relationships: [
                    { type: 'tag', attributes: { group: 'genre', name: { en: 'Romance' } } }
                ]
            };
            const stats = {
                title: {
                    rating: { bayesian: 6.5 },
                    follows: 123
                }
            };
            getLocalizedTitle.mockReturnValue('Nami Longdesc');
            // Simulate a too-long description
            getLocalizedDescription.mockReturnValue('a'.repeat(5000));
            buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
            expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('(...)'));
        });

        it('should call buildNamiComiEmbed for namicomi type', () => {
            // This test just ensures no error is thrown for namicomi type (actual logic is stubbed)
            let title = {
                id: 'nami1',
                attributes: {
                    title: { en: 'Nami Title' },
                    description: { en: 'desc' },
                    year: 2022,
                    publicationStatus: 'ongoing',
                    demographic: 'shounen',
                    contentRating: 'safe',
                    tags: [
                        { attributes: { group: 'genre', name: { en: 'Romance' } } }
                    ],
                    readingMode: 'vls'
                },
                relationships: [
                    { type: 'tag', attributes: { group: 'genre', name: { en: 'Romance' } } }
                ]
            };
            const stats = {
                title: {
                    rating: { bayesian: 6.5 },
                    follows: 123
                }
            };
            getLocalizedTitle.mockReturnValue('Nami Title');
            getLocalizedDescription.mockReturnValue('desc');
            buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
            // Should add reading mode field for 'vls'
            expect(embed.addFields).toHaveBeenCalledWith({ name: 'Reading Mode', value: 'Vertical' });

            // Now test 'rtl' and 'ltr' branches
            title.attributes.readingMode = 'rtl';

            console.log(JSON.stringify(title));
            buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
            expect(embed.addFields).toHaveBeenCalledWith({ name: 'Reading Mode', value: 'Horizontal (Right to Left)' });

            title.attributes.readingMode = 'ltr';
            buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
            expect(embed.addFields).toHaveBeenCalledWith({ name: 'Reading Mode', value: 'Horizontal (Left to Right)' });
        });

        it('should truncate NamiComi description if too long', () => {
            const title = {
                id: 'nami2',
                attributes: {
                    title: { en: 'Nami Longdesc' },
                    description: { en: 'desc' },
                    year: 2023,
                    publicationStatus: 'ongoing',
                    demographic: 'shounen',
                    contentRating: 'safe',
                    tags: [
                        { attributes: { group: 'genre', name: { en: 'Romance' } } }
                    ],
                    readingMode: 'vls'
                },
                relationships: [
                    { type: 'tag', attributes: { group: 'genre', name: { en: 'Romance' } } }
                ]
            };
            const stats = {
                title: {
                    rating: { bayesian: 6.5 },
                    follows: 123
                }
            };
            getLocalizedTitle.mockReturnValue('Nami Longdesc');
            // Simulate a too-long description
            getLocalizedDescription.mockReturnValue('a'.repeat(5000));
            buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
            expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('(...)'));
        });
    });
});
