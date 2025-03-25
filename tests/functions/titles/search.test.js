const search = require('../../../src/functions/titles/search');

describe('search function', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.resetAllMocks();
    });

    it('should throw an error for unsupported search types', async () => {
        await expect(search('Test', 'unsupportedType')).rejects.toThrow('Unsupported search type');
    });

    describe('MangaDex', () => {
        it('should return a map of titles when fetch is successful (MangaDex)', async () => {
            const fakeResponse = {
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: '123',
                            attributes: {
                                title: {
                                    en: 'Test Manga'
                                }
                            }
                        }
                    ]
                })
            };
            global.fetch = jest.fn().mockResolvedValue(fakeResponse);
            const result = await search('Test Manga', 'mangadex');
            expect(result).toBeInstanceOf(Map);
            expect(result.get('Test Manga')).toEqual('123');
            expect(global.fetch).toHaveBeenCalled();
        });

        it('should return null for non-ok fetch (MangaDex)', async () => {
            const fakeResponse = {
                ok: false,
                json: async () => ({})
            };
            global.fetch = jest.fn().mockResolvedValue(fakeResponse);
            const result = await search('Test', 'mangadex');
            expect(result).toBeNull();
        });

        it('should return null when fetch throws an error (MangaDex)', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Fetch error'));
            const result = await search('Test', 'mangadex');
            expect(result).toBeNull();
        });

        it('should return null for empty results (MangaDex)', async () => {
            const fakeResponse = {
                ok: true,
                json: async () => ({
                    data: []
                })
            };
            global.fetch = jest.fn().mockResolvedValue(fakeResponse);
            const result = await search('Test', 'mangadex');
            expect(result).toBeNull();
        });
    });

    describe('NamiComi', () => {
        it('should return a map of titles with locale support when fetch is successful (NamiComi)', async () => {
            const fakeResponse = {
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: '456',
                            attributes: {
                                title: {
                                    en: 'Sample Title',
                                    es: 'Título de Ejemplo'
                                }
                            }
                        }
                    ]
                })
            };
            global.fetch = jest.fn().mockResolvedValue(fakeResponse);
            // Test with 'en' locale
            const resultEn = await search('Sample Title', 'namicomi', 'en');
            expect(resultEn).toBeInstanceOf(Map);
            expect(resultEn.get('Sample Title')).toEqual('456');

            // Test with 'es' locale
            const resultEs = await search('Sample Title', 'namicomi', 'es');
            // Since locale 'es' exists, it should pick it.
            expect(resultEs).toBeInstanceOf(Map);
            expect(resultEs.get('Título de Ejemplo')).toEqual('456');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should return null for non-ok fetch (NamiComi)', async () => {
            const fakeResponse = {
                ok: false,
                json: async () => ({})
            };
            global.fetch = jest.fn().mockResolvedValue(fakeResponse);
            const result = await search('Test', 'namicomi');
            expect(result).toBeNull();
        });

        it('should return null when fetch throws an error (NamiComi)', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Fetch error'));
            const result = await search('Test', 'namicomi');
            expect(result).toBeNull();
        });

        it('should return null for empty results (NamiComi)', async () => {
            const fakeResponse = {
                ok: true,
                json: async () => ({
                    data: []
                })
            };
            global.fetch = jest.fn().mockResolvedValue(fakeResponse);
            const result = await search('Test', 'namicomi');
            expect(result).toBeNull();
        });

        describe('Localized Title Fallback', () => {
            it('should fallback to "es-419" if "es" is not available', async () => {
                const fakeResponse = {
                    ok: true,
                    json: async () => ({
                        data: [
                            {
                                id: '789',
                                attributes: {
                                    title: {
                                        'es-419': 'Título en Español',
                                        en: 'Title in English'
                                    }
                                }
                            }
                        ]
                    })
                };
                global.fetch = jest.fn().mockResolvedValue(fakeResponse);
                const result = await search('Title in English', 'namicomi', 'es');
                expect(result).toBeInstanceOf(Map);
                expect(result.get('Título en Español')).toEqual('789');
            });
            it('should fallback to "en" if no localized title is found', async () => {
                const fakeResponse = {
                    ok: true,
                    json: async () => ({
                        data: [
                            {
                                id: '101112',
                                attributes: {
                                    title: {
                                        fr: 'Titre en Français'
                                    }
                                }
                            }
                        ]
                    })
                };
                global.fetch = jest.fn().mockResolvedValue(fakeResponse);
                const result = await search('Titre en Français', 'namicomi', 'es');
                expect(result).toBeInstanceOf(Map);
                expect(result.get('Titre en Français')).toEqual('101112');
            });
        })
    })
});