const { getTitleTags, addTitleTags } = require('../../../src/functions/titles/titleTags');

describe('getTitleTags', () => {
    describe('MangaDex', () => {
        const sampleTitle = {
            attributes: {
                tags: [
                    {
                        attributes: {
                            group: 'genre',
                            name: { en: "Action" }
                        }
                    },
                    {
                        attributes: {
                            group: 'theme',
                            name: { en: "Fantasy" }
                        }
                    }
                ]
            }
        };

        it("should return grouped tags for mangadex type and fill missing groups with 'N/A'", () => {
            const result = getTitleTags(sampleTitle, 'mangadex');
            expect(result).toEqual({
                theme: "Fantasy",
                genre: "Action",
                content: "N/A",
                format: "N/A"
            });
        });

        it('should return early if the tag is missing group or name', () => {
            const incompleteTitle = {
                attributes: {
                    tags: [
                        {
                            attributes: {
                                group: 'genre'
                            }
                        },
                        {
                            attributes: {
                                name: { en: "Action" }
                            }
                        }
                    ]
                }
            };
            const result = getTitleTags(incompleteTitle, 'mangadex');
            expect(result).toEqual({
                theme: "N/A",
                genre: "N/A",
                content: "N/A",
                format: "N/A"
            })
        });
    });

    describe('NamiComi', () => {
        const sampleTitle = {
            relationships: [
                {
                    type: 'tag',
                    attributes: {
                        group: 'format',
                        name: { en: "Webtoon", ja: "ウェブトゥーン" }
                    }
                },
                {
                    type: 'primary_tag',
                    attributes: {
                        group: 'genre',
                        name: { en: "Romance", ja: "ロマンス" }
                    }
                },
                {
                    type: 'secondary_tag',
                    attributes: {
                        group: 'content-warnings',
                        name: { en: "Mild Violence" }
                    }
                },
                {
                    type: 'tag',
                    attributes: {
                        group: 'admin-only',
                        name: { en: "Nami's TT Gold Winner", ja: "ナミのTTゴールドウィナー" }
                    }
                },
                {
                    type: 'tag',
                    attributes: {
                        group: 'theme',
                        name: { en: "Vampires", ja: "バンパイア" }
                    }
                }
            ]
        };

        it("should return grouped tags for namicomi type using locale", () => {
            const locale = 'ja';
            const result = getTitleTags(sampleTitle, 'namicomi', locale);
            expect(result).toEqual({
                content_warning: "Mild Violence",
                format: "ウェブトゥーン",
                genre: "ロマンス",
                theme: "バンパイア",
                other: "ナミのTTゴールドウィナー"
            });
        });

        it("should fall back to English if localized name not available", () => {
            const locale = 'fr';
            const result = getTitleTags(sampleTitle, 'namicomi', locale);
            expect(result).toEqual({
                content_warning: "Mild Violence",
                format: "Webtoon",
                genre: "Romance",
                theme: "Vampires",
                other: "Nami's TT Gold Winner"
            });
        });

        it("should return 'N/A' for empty groups", () => {
            const emptyTitle = { relationships: [] };
            const result = getTitleTags(emptyTitle, 'namicomi', 'ja');
            expect(result).toEqual({
                content_warning: "N/A",
                format: "N/A",
                genre: "N/A",
                theme: "N/A",
                other: "N/A"
            });
        });

        it("should return early if the tag is missing group or name", () => {
            const incompleteTitle = {
                relationships: [
                    {
                        type: 'tag',
                        attributes: {
                            group: 'format'
                        }
                    },
                    {
                        type: 'primary_tag',
                        attributes: {
                            name: { en: "Romance" }
                        }
                    }
                ]
            };
            const result = getTitleTags(incompleteTitle, 'namicomi', 'ja');
            expect(result).toEqual({
                content_warning: "N/A",
                format: "N/A",
                genre: "N/A",
                theme: "N/A",
                other: "N/A"
            });
        });
    });

    describe('unsupported type', () => {
        const sampleTitle = {};
        it("should throw an error for unsupported type", () => {
            expect(() => getTitleTags(sampleTitle, 'unsupported')).toThrow('Unsupported type');
        });
    });
});

describe('addTitleTags', () => {
    let embed;
    let translations;

    beforeEach(() => {
        embed = { addFields: jest.fn() };
        translations = {
            embed: {
                fields: {
                    format: 'Format',
                    genres: 'Genres',
                    themes: 'Themes',
                    content_warning: 'Content Warning',
                    other_tags: 'Other'
                }
            }
        };
    });

    describe('MangaDex', () => {
        const sampleTitle = {
            attributes: {
                tags: [
                    { attributes: { group: 'genre', name: { en: 'Action' } } },
                    { attributes: { group: 'theme', name: { en: 'Fantasy' } } }
                ]
            }
        };

        it('should add correct fields for mangadex', () => {
            addTitleTags(sampleTitle, embed, translations, 'mangadex');
            expect(embed.addFields).toHaveBeenCalledWith([
                { name: 'Format', value: 'N/A', inline: true },
                { name: 'Genres', value: 'Action', inline: true },
                { name: 'Themes', value: 'Fantasy', inline: true },
                { name: 'Content Warning', value: 'N/A', inline: true }
            ]);
        });

        it('should return early if there are no tags', () => {
            const emptyTitle = { attributes: { tags: [] } };
            addTitleTags(emptyTitle, embed, translations, 'mangadex');
            expect(embed.addFields).toHaveBeenCalledWith([
                { name: 'Format', value: 'N/A', inline: true },
                { name: 'Genres', value: 'N/A', inline: true },
                { name: 'Themes', value: 'N/A', inline: true },
                { name: 'Content Warning', value: 'N/A', inline: true }
            ]);
        });
    });

    describe('NamiComi', () => {
        const sampleTitle = {
            relationships: [
                { type: 'tag', attributes: { group: 'format', name: { en: 'Webtoon', ja: 'ウェブトゥーン' } } },
                { type: 'primary_tag', attributes: { group: 'genre', name: { en: 'Romance', ja: 'ロマンス' } } },
                { type: 'secondary_tag', attributes: { group: 'content-warnings', name: { en: 'Mild Violence' } } },
                { type: 'tag', attributes: { group: 'admin-only', name: { en: "Nami's TT Gold Winner", ja: 'ナミのTTゴールドウィナー' } } },
                { type: 'tag', attributes: { group: 'theme', name: { en: 'Vampires', ja: 'バンパイア' } } }
            ]
        };

        it('should add correct fields for namicomi with locale', () => {
            addTitleTags(sampleTitle, embed, translations, 'namicomi', 'ja');
            expect(embed.addFields).toHaveBeenCalledWith([
                { name: 'Format', value: 'ウェブトゥーン', inline: true },
                { name: 'Genres', value: 'ロマンス', inline: true },
                { name: 'Themes', value: 'バンパイア', inline: true },
                { name: 'Content Warning', value: 'Mild Violence', inline: true },
                { name: 'Other', value: 'ナミのTTゴールドウィナー', inline: true }
            ]);
        });
    });

    it('should throw for unsupported type', () => {
        expect(() => addTitleTags({}, embed, translations, 'unsupported')).toThrow('Unsupported type');
    });
})