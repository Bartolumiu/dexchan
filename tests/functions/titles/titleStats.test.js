const getTitleStats = require('../../../src/functions/titles/titleStats');

describe('getTitleStats', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    it('should throw an error for an unsupported type', async () => {
        await expect(getTitleStats('789', 'unsupported')).rejects.toThrow('Unsupported type');
    });

    describe('MangaDex', () => {
        it('should return statistics when fetch is successful', async () => {
            const mockStats = { views: 200 };
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ statistics: { '123': mockStats } })
            });
            const result = await getTitleStats('123', 'mangadex');
            expect(result).toEqual(mockStats);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    
        it('should return null when response is not ok', async () => {
            global.fetch.mockResolvedValue({ ok: false });
            const result = await getTitleStats('123', 'mangadex');
            expect(result).toBeNull();
        });
    
        it('should return null when fetch throws an error', async () => {
            global.fetch.mockRejectedValue(new Error('network error'));
            const result = await getTitleStats('123', 'mangadex');
            expect(result).toBeNull();
        });

        it('should return null if the statistics object is empty (impossible case under normal circunstances)', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ statistics: {} })
            });
            const result = await getTitleStats('123', 'mangadex');
            expect(result).toBeNull();
        });
    });

    describe('NamiComi', () => {
        it('should return statistics when both fetch calls are successful', async () => {
            const ratingsResponse = {
                ok: true,
                json: async () => ({ data: { attributes: { rating: 4.5 } } })
            };
            const statsResponse = {
                ok: true,
                json: async () => ({
                    data: { attributes: { commentCount: 3, followCount: 150, viewCount: 3000 } }
                })
            };
            // First call resolves to ratingsResponse, second to statsResponse
            global.fetch
                .mockResolvedValueOnce(ratingsResponse)
                .mockResolvedValueOnce(statsResponse);
        
            const result = await getTitleStats('456', 'namicomi');
            expect(result).toEqual({
                comments: { threadId: null, repliesCount: 3 },
                rating: {
                    average: 0,
                    bayesian: 4.5,
                    distribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                follows: 150,
                views: 3000
            });
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should return null if either fetch call returns a non-ok response', async () => {
            const ratingsResponse = { ok: false };
            const statsResponse = {
                ok: true,
                json: async () => ({
                    data: { attributes: { commentCount: 3, followCount: 150, viewCount: 3000 } }
                })
            };
            global.fetch
                .mockResolvedValueOnce(ratingsResponse)
                .mockResolvedValueOnce(statsResponse);
        
            const result = await getTitleStats('456', 'namicomi');
            expect(result).toBeNull();
        });
        
        it('should return null when fetch throws an error', async () => {
            global.fetch
                .mockRejectedValueOnce(new Error('error'))
                .mockRejectedValueOnce(new Error('error'));
        
            const result = await getTitleStats('456', 'namicomi');
            expect(result).toBeNull();
        });
    });
});