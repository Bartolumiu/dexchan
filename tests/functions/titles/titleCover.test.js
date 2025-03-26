const getCover = require('../../../src/functions/titles/titleCover');

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

    it('should throw an error for unsupported cover types', async () => {
        await expect(getCover({}, 'unsupported')).rejects.toThrow('Unsupported type');
    });

    describe('MangaDex', () => {
        const mangadexTitle = {
            id: '123',
            relationships: [
                { type: 'cover_art', attributes: { fileName: 'cover1' } }
            ]
        };

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

        it('should fall back to default cover if no coverName is found', async () => {
            const titleWithNoCoverName = {
                id: '456',
                relationships: [
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