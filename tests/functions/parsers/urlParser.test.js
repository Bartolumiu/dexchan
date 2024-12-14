// tests/functions/parsers/urlParser.test.js
const { parseURL, parseNamiComiURL, parseMangaDexURL } = require('../../../src/functions/parsers/urlParser');

describe('parseURL edge cases', () => {
    it.each([
        { url: null, type: "namicomi", expected: null },
        { url: '', type: "namicomi", expected: null },
        { url: 'https://example.com', type: 'unknown', expected: null }
    ])('should return $expected for $url with type $type', async ({ url, type, expected }) => {
        const result = await parseURL(url, type);
        expect(result).toBe(expected);
    });
});

describe('URL Parser', () => {
    describe('parseURL', () => {
        it('should return null for unsupported URL type', async () => {
            const url = "https://example.com/title/12345";
            const type = "unknown";
            const result = await parseURL(url, type);
            expect(result).toBeNull();
        });

        it('should return null for an invalid NamiComi URL', async () => {
            const url = "https://namicomi.com/invalid-url";
            const type = "namicomi";
            const result = await parseURL(url, type);
            expect(result).toBeNull();
        })

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
        it('should return null for an invalid NamiComi URL', async () => {
            const url = "https://namicomi.com/title-only";
            const result = await parseNamiComiURL(url);
            expect(result).toBeNull();
        });

        it('should extract ID from NamiComi primary URL', async () => {
            const url = "https://namicomi.com/en/title/aEj4pEHC/umidachi";
            const result = await parseNamiComiURL(url);
            expect(result).toBe("aEj4pEHC");
        });
    });

    describe('parseMangaDexURL', () => {
        it('should return null for an invalid MangaDex URL', async () => {
            const url = "https://mangadex.org/title-only";
            const result = await parseMangaDexURL(url);
            expect(result).toBeNull();
        });

        it('should extract ID from MangaDex URL, ignoring query parameters', async () => {
            const url = "https://mangadex.org/title/f9c33607-9180-4ba6-b85c-e4b5faee7192/official-test-manga?tab=related";
            const result = await parseMangaDexURL(url);
            expect(result).toBe("f9c33607-9180-4ba6-b85c-e4b5faee7192");
        });
    });
});