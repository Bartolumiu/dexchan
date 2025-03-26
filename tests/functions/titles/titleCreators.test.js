const getTitleCreators = require('../../../src/functions/titles/titleCreators');

describe('getTitleCreators', () => {
    it('should throw an error for unsupported type', () => {
        const title = { relationships: [] };
        expect(() => getTitleCreators(title, 'unsupported')).toThrow('Unsupported type');
    });

    describe('MangaDex', () => {
        it('should return a comma-separated list of authors and artists', () => {
            const title = {
                relationships: [
                    { type: 'author', attributes: { name: 'Alice' } },
                    { type: 'artist', attributes: { name: 'Bob' } },
                    { type: 'artist', attributes: { name: 'Alice' } } // duplicate, should appear only once
                ]
            };
            const result = getTitleCreators(title, 'mangadex');
            expect(result).toBe('Alice, Bob');
        })
    });

    describe('NamiComi', () => {
        it('should return a comma-separated list of organizations', () => {
            const title = {
                relationships: [
                    { type: 'organization', attributes: { name: 'Org1' } },
                    { type: 'organization', attributes: { name: 'Org2' } },
                    { type: 'organization', attributes: { name: 'Org1' } } // duplicate, should appear only once
                ]
            };
            const result = getTitleCreators(title, 'namicomi');
            expect(result).toBe('Org1, Org2');
        });
    });
});