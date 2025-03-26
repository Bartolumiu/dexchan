const getBanner = require('../../../src/functions/titles/titleBanner');

jest.mock('../../../src/functions/tools/getVersion', () => {
    return () => '1.0.0';
});

describe('titleBanner', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('throws error for unsupported type', async () => {
        const title = { id: 'test', attributes: { bannerFileName: 'banner.jpg' } };
        await expect(getBanner(title, 'unsupported')).rejects.toThrow('Unsupported type');
    });

    describe('NamiComi', () => {
        it('should return a Buffer if fetch is successful', async () => {
            const bannerData = new Uint8Array([1, 2, 3]).buffer;
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: async () => bannerData
            });
            const title = { id: '123', attributes: { bannerFileName: 'banner.jpg' } };
            const result = await getBanner(title, 'namicomi');
    
            expect(result).toBeInstanceOf(Buffer);
            expect(result.equals(Buffer.from(bannerData))).toBe(true);
    
            const expectedUrl = new URL(`https://uploads.namicomi.com/media/manga/123/banner/banner.jpg`);
            expect(global.fetch).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({
                method: 'GET',
                timeout: 5000,
                headers: { 'User-Agent': 'Dex-chan/1.0.0 by Bartolumiu' }
            }));
        });

        it('should return null if bannerFileName is missing', async () => {
            // With missing bannerFileName, buildURL() returns null,
            // so fetch(url, ...) will throw an error caught in getNamiComiBanner.
            const title = { id: 'test', attributes: {} };
            global.fetch.mockImplementation(() => Promise.reject(new Error('Invalid URL')));
            const result = await getBanner(title, 'namicomi');
            expect(result).toBeNull();
            expect(global.fetch).toHaveBeenCalled();
        });
    
        it('should return null if fetch response is not ok', async () => {
            const title = { id: '123', attributes: { bannerFileName: 'banner.jpg' } };
            global.fetch.mockResolvedValue({
                ok: false,
                arrayBuffer: async () => null
            });
            const result = await getBanner(title, 'namicomi');
            expect(result).toBeNull();
        });

        it('should return null if fetch throws an error', async () => {
            const title = { id: '123', attributes: { bannerFileName: 'banner.jpg' } };
            global.fetch.mockRejectedValue(new Error('Network error'));
            const result = await getBanner(title, 'namicomi');
            expect(result).toBeNull();
        });
    });
});