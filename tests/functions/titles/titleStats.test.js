const getTitleStats = require('../../../src/functions/titles/titleStats');

describe('getTitleStats', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    it('should return null for an unsupported type', async () => {
        const result = await getTitleStats('789', 'unsupported');
        expect(result).toBeNull();
    });

    describe('MangaDex', () => {
        it('should return statistics when fetch is successful', async () => {
            const mockStats = {
                title: {
                    comments: {
                        threadId: null,
                        repliesCount: 0
                    },
                    rating: {
                        average: '0.00',
                        bayesian: '0.00',
                        distribution: {
                            "1": 0,
                            "2": 0,
                            "3": 0,
                            "4": 0,
                            "5": 0,
                            "6": 0,
                            "7": 0,
                            "8": 0,
                            "9": 0,
                            "10": 0
                        },
                        count: 0
                    },
                    follows: 0,
                    views: 0
                },
                chapters: {
                    comments: 0,
                    reactions: 0,
                    views: 0
                }
            };
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

        it('should return null if the statistics object is empty (impossible case under normal circumstances)', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ statistics: {} })
            });
            const result = await getTitleStats('123', 'mangadex');
            expect(result).toBeNull();
        });

        it('should calculate the total count from the distribution', async () => {
            const mockStatsWithRatings = {
                rating: {
                    average: 8.5,
                    bayesian: 8.4,
                    distribution: {
                        "8": 5,
                        "9": 10,
                        "10": 5
                    }
                },
                follows: 100
            };

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ statistics: { '123': mockStatsWithRatings } })
            });

            const result = await getTitleStats('123', 'mangadex');
            expect(result.title.rating.count).toBe(20); // 5 + 10 + 5
        });
    });

    describe('NamiComi', () => {
        it('should return statistics when both fetch calls are successful', async () => {
            const ratingsResponse = {
                ok: true,
                json: async () => ({ data: { attributes: { rating: 4.5, count: 0 } } })
            };
            const statsResponse = {
                ok: true,
                json: async () => ({
                    data: { attributes: { 
                        commentCount: 3, 
                        followCount: 150, 
                        viewCount: 3000,
                        extra: {
                            totalChapterViews: { en: 10, ja: 5 },
                            totalChapterComments: { en: 2, ja: 3 },
                            totalChapterReactions: { en: 1, ja: 4 }
                        }
                    } }
                })
            };
            // First call resolves to ratingsResponse, second to statsResponse
            global.fetch
                .mockResolvedValueOnce(ratingsResponse)
                .mockResolvedValueOnce(statsResponse);
        
            const result = await getTitleStats('456', 'namicomi');
            expect(result).toEqual({
                title: {
                    comments: { threadId: null, repliesCount: 3 },
                    rating: {
                        average: 0,
                        bayesian: "4.50",
                        distribution: {
                            "1": 0,
                            "2": 0,
                            "3": 0,
                            "4": 0,
                            "5": 0,
                            "6": 0,
                            "7": 0,
                            "8": 0,
                            "9": 0,
                            "10": 0
                        },
                        count: 0
                    },
                    follows: 150,
                    views: 3000
                },
                chapters: {
                    views: 15,  // 10 + 5
                    comments: 5,  // 2 + 3
                    reactions: 5  // 1 + 4
                }
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

        it('should handle missing NamiComi attributes by using default values', async () => {
            const ratingsResponse = {
                ok: true,
                json: async () => ({ data: { attributes: { rating: 0, count: null } } })
            };
            const statsResponse = {
                ok: true,
                json: async () => ({ })
            };

            global.fetch.mockResolvedValueOnce(ratingsResponse).mockResolvedValueOnce(statsResponse);

            const result = await getTitleStats('456', 'namicomi');

            expect(result.title.comments.repliesCount).toBe(0);
            expect(result.title.rating.bayesian).toBe("0.00");
            expect(result.title.rating.count).toBe(0);
            expect(result.title.follows).toBe(0);
            expect(result.title.views).toBe(0);
            expect(result.chapters.views).toBe(0);
            expect(result.chapters.comments).toBe(0);
            expect(result.chapters.reactions).toBe(0);
        })
    });

    describe('MangaBaka', () => {
        it('should return an empty object (placeholder for future API support)', async () => {
            const result = await getTitleStats('5250', 'mangabaka');
            expect(result).toEqual({});
        });
    });
});