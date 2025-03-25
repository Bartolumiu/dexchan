const getTitleDetails = require('../../../src/functions/titles/details');

describe('getTitleDetails', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should throw error for unsupported type', async () => {
        await expect(getTitleDetails('789', 'unsupported')).rejects.toThrow('Unsupported type');
    });

    describe('MangaDex', () => {
        it('should fetch details from MangaDex successfully', async () => {
            const fakeResponse = { data: { id: '123', name: 'Test Manga' } };
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(fakeResponse),
            });
    
            const result = await getTitleDetails('123', 'mangadex');
            expect(global.fetch).toHaveBeenCalled();
            expect(result).toEqual(fakeResponse.data);
        });

        it('should return null if MangaDex fetch response is not ok', async () => {
            global.fetch.mockResolvedValue({ ok: false });
            const result = await getTitleDetails('123', 'mangadex');
            expect(result).toBeNull();
        });

        it('should return null if MangaDex fetch fails', async () => {
            global.fetch.mockRejectedValue(new Error('Timeout'));
            const result = await getTitleDetails('123', 'mangadex');
            expect(result).toBeNull();
        });
    });

    describe('NamiComi', () => {
        it('should fetch details from NamiComi successfully', async () => {
            const fakeResponse = { data: { id: '456', name: 'Nami Title' } };
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(fakeResponse),
            });
    
            const result = await getTitleDetails('456', 'namicomi');
            expect(global.fetch).toHaveBeenCalled();
            expect(result).toEqual(fakeResponse.data);
        });

        it('should return null if NamiComi fetch response is not ok', async () => {
            global.fetch.mockResolvedValue({ ok: false });
            const result = await getTitleDetails('456', 'namicomi');
            expect(result).toBeNull();
        });
    
        it('should return null if NamiComi fetch fails', async () => {
            global.fetch.mockRejectedValue(new Error('Timeout'));
            const result = await getTitleDetails('456', 'namicomi');
            expect(result).toBeNull();
        });
    })
});