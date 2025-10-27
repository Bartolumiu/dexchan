const getCover = require('../../../src/functions/titles/titleCover');
let { buildURL } = require('../../../src/functions/titles/titleCover');

describe('getCover', () => {
    const originalFetch = global.fetch;
    const dummyBuffer = new Uint8Array([1, 2, 3]).buffer;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.clearAllMocks();
    });

    it('should return null for unsupported cover types', async () => {
        const result = await getCover({}, 'unsupported');
        expect(result).toBeNull();
    });

    describe('MangaBaka', () => {
        const mangabakaTitle = {
            id: '5258',
            cover: { "default": "https://example.com/covers/5258-default.jpg" }
        };

        it('should return null if buildURL returns null for MangaBaka', async () => {
            buildURL = jest.fn().mockReturnValue(null);
            const title = { }; // Should return early due to null URL
            const coverBuffer = await getCover(title, 'mangabaka');
            expect(coverBuffer).toBeNull();
        });

        it('should return a buffer when fetching a MangaBaka cover successfully', async () => {
            // Mock fetch response for successful mangabaka cover
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });

            const coverBuffer = await getCover(mangabakaTitle, 'mangabaka');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(coverBuffer).toEqual(Buffer.from(dummyBuffer));
        });

        it('should return null when MangaBaka fetch response is not ok', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });

            const coverBuffer = await getCover(mangabakaTitle, 'mangabaka');
            expect(coverBuffer).toBeNull();
        });

        it('should return null when MangaBaka fetch throws an error', async () => {
            global.fetch.mockRejectedValue(new Error('network error'));
            const coverBuffer = await getCover(mangabakaTitle, 'mangabaka');
            expect(coverBuffer).toBeNull();
        });
    });

    describe('MangaDex', () => {
        const mangadexTitle = {
            id: '123',
            relationships: [
                { type: 'cover_art', attributes: { fileName: 'cover1' } }
            ]
        };

        it('should return null if buildURL returns null for MangaDex', async () => {
            buildURL = jest.fn().mockReturnValue(null);
            const title = { }; // Should return early due to null URL
            const coverBuffer = await getCover(title, 'mangadex');
            expect(coverBuffer).toBeNull();
        });

        it('should return null if title has no cover_art relationship for MangaDex', async () => {
            const title = { id: '123', relationships: [] };
            const coverBuffer = await getCover(title, 'mangadex');
            expect(coverBuffer).toBeNull();
        });

        it('should return a buffer when fetching a MangaDex cover successfully', async () => {
            // Mock fetch response for successful mangadex cover
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });
    
            const coverBuffer = await getCover(mangadexTitle, 'mangadex');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(coverBuffer).toEqual(Buffer.from(dummyBuffer));
        });
    
        it('should return null when MangaDex fetch response is not ok', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });
    
            const coverBuffer = await getCover(mangadexTitle, 'mangadex');
            expect(coverBuffer).toBeNull();
        });

        it('should return null when MangaDex fetch throws an error', async () => {
            global.fetch.mockRejectedValue(new Error('network error'));
            const coverBuffer = await getCover(mangadexTitle, 'mangadex');
            expect(coverBuffer).toBeNull();
        });
    });

    describe('NamiComi', () => {
        const namicomiTitle = {
            id: '456',
            relationships: [
                { type: 'cover_art', attributes: { fileName: 'cover2', locale: 'en' } }
            ]
        };

        it('should return null if buildURL returns null for NamiComi', async () => {
            buildURL = jest.fn().mockReturnValue(null);
            const title = { }; // Should return early due to null URL
            const coverBuffer = await getCover(title, 'namicomi', 'en');
            expect(coverBuffer).toBeNull();
        });

        it('should return null if title has no cover_art relationship for NamiComi', async () => {
            const title = { id: '456', relationships: [] };
            const coverBuffer = await getCover(title, 'namicomi', 'en');
            expect(coverBuffer).toBeNull();
        });

        it('should use es-419 cover if locale is es and no es cover exists', async () => {
            const title = {
                id: '789',
                relationships: [
                    { type: 'cover_art', attributes: { fileName: 'cover-es-419', locale: 'es-419' } },
                    { type: 'cover_art', attributes: { fileName: 'cover-en', locale: 'en' } }
                ]
            };
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });
            const coverBuffer = await getCover(title, 'namicomi', 'es');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            // The URL should contain 'cover-es-419'
            const calledUrl = global.fetch.mock.calls[0][0].toString();
            expect(calledUrl).toContain('cover-es-419');
            expect(coverBuffer).toEqual(Buffer.from(dummyBuffer));
        });

        it('should use es cover if locale is es-419 and no es-419 cover exists', async () => {
            const title = {
                id: '790',
                relationships: [
                    { type: 'cover_art', attributes: { fileName: 'cover-es', locale: 'es' } },
                    { type: 'cover_art', attributes: { fileName: 'cover-en', locale: 'en' } }
                ]
            };
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });
            const coverBuffer = await getCover(title, 'namicomi', 'es-419');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            // The URL should contain 'cover-es'
            const calledUrl = global.fetch.mock.calls[0][0].toString();
            expect(calledUrl).toContain('cover-es');
            expect(coverBuffer).toEqual(Buffer.from(dummyBuffer));
        });

        it('should return a buffer when fetching a NamiComi cover successfully', async () => {
            // Mock fetch response for successful namicomi cover
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });
    
            const coverBuffer = await getCover(namicomiTitle, 'namicomi', 'en');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(coverBuffer).toEqual(Buffer.from(dummyBuffer));
        });
    
        it('should return null when NamiComi fetch response is not ok', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });
    
            const coverBuffer = await getCover(namicomiTitle, 'namicomi', 'en');
            expect(coverBuffer).toBeNull();
        });

        it('should return null when NamiComi fetch throws an error', async () => {
            global.fetch.mockRejectedValue(new Error('network error'));
            const coverBuffer = await getCover(namicomiTitle, 'namicomi', 'en');
            expect(coverBuffer).toBeNull();
        });

        it('should fall back to default (first) cover if no coverName is found', async () => {
            const titleWithNoCoverName = {
                id: '456',
                relationships: [
                    { type: 'cover_art', attributes: { fileName: 'default-cover', locale: 'es' } },
                    { type: 'cover_art', attributes: { fileName: null, locale: 'en' } }
                ]
            };

            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(dummyBuffer)
            });

            const coverBuffer = await getCover(titleWithNoCoverName, 'namicomi', 'en');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(coverBuffer).toEqual(Buffer.from(dummyBuffer));
        });
    })
});