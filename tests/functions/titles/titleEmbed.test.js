const { Colors, ButtonBuilder } = require('discord.js');
const buildTitleEmbed = require('../../../src/functions/titles/titleEmbed');
const getLocalizedTitle = require('../../../src/functions/titles/localizedTitle');
const getLocalizedDescription = require('../../../src/functions/titles/localizedDescription');

jest.mock('../../../src/functions/titles/localizedTitle');
jest.mock('../../../src/functions/titles/localizedDescription');

describe('buildTitleEmbed', () => {

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
        translations.embed.fields.reading_mode = {
            name: 'Reading Mode',
            vertical: 'Vertical',
            horizontal: { right_to_left: 'RTL', left_to_right: 'LTR' }
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
        translations.embed.fields.reading_mode = {
            name: 'Reading Mode',
            vertical: 'Vertical',
            horizontal: { right_to_left: 'RTL', left_to_right: 'LTR' }
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
        translations.embed.fields.pub_status.value = {};
        translations.embed.fields.demographic.value = {};
        translations.embed.fields.content_rating.value = {};
        translations.embed.fields.reading_mode = {
            name: 'Reading Mode',
            vertical: 'Vertical',
            horizontal: { right_to_left: 'RTL', left_to_right: 'LTR' }
        };
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
        translations.embed.fields.reading_mode = {
            name: 'Reading Mode',
            vertical: 'Vertical',
            horizontal: {
                right_to_left: 'RTL',
                left_to_right: 'LTR'
            }
        };
        getLocalizedTitle.mockReturnValue('Nami Longdesc');
        // Simulate a too-long description
        getLocalizedDescription.mockReturnValue('a'.repeat(5000));
        buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
        expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('(...)'));
    });
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
            embed: {
                error: {
                    no_description: 'No description available.'
                },
                fields: {
                    rating: 'Rating',
                    follows: 'Follows',
                    year: 'Year',
                    pub_status: {
                        name: 'Status',
                        value: { ongoing: 'Ongoing', completed: 'Completed' }
                    },
                    demographic: {
                        name: 'Demographic',
                        value: { shounen: 'Shounen' }
                    },
                    content_rating: {
                        name: 'Content Rating',
                        value: { safe: 'Safe' }
                    },
                    type: {
                        name: 'Type',
                        value: { manga: 'Manga', novel: 'Novel', manhwa: 'Long Strip', comic: 'Comic' }
                    }
                }
            },
            button: {
                open: 'View Title'
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

    it('should call buildNamiComiEmbed for namicomi type', () => {
        // This test just ensures no error is thrown for namicomi type (actual logic is stubbed)
        const title = {
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
        // Add reading_mode translations for full coverage
        translations.embed.fields.reading_mode = {
            name: 'Reading Mode',
            vertical: 'Vertical',
            horizontal: {
                right_to_left: 'RTL',
                left_to_right: 'LTR'
            }
        };
        getLocalizedTitle.mockReturnValue('Nami Title');
        getLocalizedDescription.mockReturnValue('desc');
        buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
        // Should add reading mode field for 'vls'
        expect(embed.addFields).toHaveBeenCalledWith({ name: 'Reading Mode', value: 'Vertical' });

        // Now test 'rtl' and 'ltr' branches
        title.attributes.readingMode = 'rtl';
        buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
        expect(embed.addFields).toHaveBeenCalledWith({ name: 'Reading Mode', value: 'RTL' });

        title.attributes.readingMode = 'ltr';
        buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
        expect(embed.addFields).toHaveBeenCalledWith({ name: 'Reading Mode', value: 'LTR' });
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
        translations.embed.fields.reading_mode = {
            name: 'Reading Mode',
            vertical: 'Vertical',
            horizontal: {
                right_to_left: 'RTL',
                left_to_right: 'LTR'
            }
        };
        getLocalizedTitle.mockReturnValue('Nami Longdesc');
        // Simulate a too-long description
        getLocalizedDescription.mockReturnValue('a'.repeat(5000));
        buildTitleEmbed(embed, locale, title, stats, translations, 'namicomi');
        expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('(...)'));
    });

    it('should throw for unknown type', () => {
        const title = { id: 'x', attributes: { title: { en: 'X' } } };
        const stats = {};
        expect(() => buildTitleEmbed(embed, locale, title, stats, translations, 'unknown')).toThrow('Unsupported type');
    });
});
