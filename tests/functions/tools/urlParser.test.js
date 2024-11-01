// tests/functions/tools/urlParser.test.js
const { parseURL, parseNamiComiURL, parseMangaDexURL } = require('../../../src/functions/tools/urlParser');

describe('URL Parser', () => {
    describe('parseURL', () => {
        it('should correctly parse a NamiComi URL', async () => {
            const url = "https://namicomi.com/en/title/Vx5jXEba/nami-explains";
            const type = "namicomi";
            const result = await parseURL(url, type);
            expect(result).toBe("Vx5jXEba");
        });

        it('should correctly parse a semi-shortened NamiComi URL', async () => {
            const url = "https://namicomi.com/t/Vx5jXEba";
            const type = "namicomi";
            const result = await parseURL(url, type);
            expect(result).toBe("Vx5jXEba");
        });

        it('should correctly parse a shortened NamiComi URL', async () => {
            const url = "https://nami.moe/t/Vx5jXEba";
            const type = "namicomi";
            const result = await parseURL(url, type);
            expect(result).toBe("Vx5jXEba");
        });

        it('should correctly parse a MangaDex URL', async () => {
            const url = "https://mangadex.org/title/f9c33607-9180-4ba6-b85c-e4b5faee7192/official-test-manga";
            const type = "mangadex";
            const result = await parseURL(url, type);
            expect(result).toBe("f9c33607-9180-4ba6-b85c-e4b5faee7192");
        });

        it('should return null if no URL is provided', async () => {
            const url = null;
            const type = "namicomi";
            const result = await parseURL(url, type);
            expect(result).toBeNull();
        });
    });

    describe('parseNamiComiURL', () => {
        it('should extract ID from NamiComi primary URL', async () => {
            const url = "https://namicomi.com/en/title/aEj4pEHC/umidachi";
            const result = await parseNamiComiURL(url);
            expect(result).toBe("aEj4pEHC");
        });
    });

    describe('parseMangaDexURL', () => {
        it('should extract ID from MangaDex URL, ignoring query parameters', async () => {
            const url = "https://mangadex.org/title/f9c33607-9180-4ba6-b85c-e4b5faee7192/official-test-manga?tab=related";
            const result = await parseMangaDexURL(url);
            expect(result).toBe("f9c33607-9180-4ba6-b85c-e4b5faee7192");
        });
    });
});