// tests/functions/parsers/urlParser.test.js
const { parseURL, checkID } = require('../../../src/functions/parsers/urlParser');

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

        it('should correctly parse a MangaBaka URL', async () => {
            const url = "https://mangabaka.dev/5258/re-united";
            const type = "mangabaka";
            const result = await parseURL(url, type);
            expect(result).toBe("5258");
        })

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
            const result = await parseURL(url, 'namicomi');
            expect(result).toBeNull();
        });

        it('should extract ID from NamiComi primary URL', async () => {
            const url = "https://namicomi.com/en/title/aEj4pEHC/umidachi";
            const result = await parseURL(url, 'namicomi');
            expect(result).toBe("aEj4pEHC");
        });
    });

    describe('parseMangaDexURL', () => {
        it('should return null for an invalid MangaDex URL', async () => {
            const url = "https://mangadex.org/title-only";
            const result = await parseURL(url, 'mangadex');
            expect(result).toBeNull();
        });

        it('should extract ID from MangaDex URL, ignoring query parameters', async () => {
            const url = "https://mangadex.org/title/f9c33607-9180-4ba6-b85c-e4b5faee7192/official-test-manga?tab=related";
            const result = await parseURL(url, 'mangadex');
            expect(result).toBe("f9c33607-9180-4ba6-b85c-e4b5faee7192");
        });
    });

    describe('parseMangaBakaURL', () => {
        it('should return null for an invalid MangaBaka URL', async () => {
            const url = "https://mangabaka.dev/title-only";
            const result = await parseURL(url, 'mangabaka');
            expect(result).toBeNull();
        })
    })

    describe('checkID', () => {
        it('should return null for unsupported ID type', async () => {
            const id = "12345";
            const type = "unknown";
            const result = await checkID(id, type);
            expect(result).toBeNull();
        });

        it('should return true for a valid NamiComi ID', async () => {
            const id = "aEj4pEHC";
            const type = "namicomi";
            const result = await checkID(id, type);
            expect(result).toBe(true);
        });

        it('should return false for an invalid NamiComi ID', async () => {
            const id = "invalidID";
            const type = "namicomi";
            const result = await checkID(id, type);
            expect(result).toBe(false);
        });

        it('should return true for a valid MangaDex ID', async () => {
            const id = "f9c33607-9180-4ba6-b85c-e4b5faee7192";
            const type = "mangadex";
            const result = await checkID(id, type);
            expect(result).toBe(true);
        });

        it('should return false for an invalid MangaDex ID', async () => {
            const id = "invalidID";
            const type = "mangadex";
            const result = await checkID(id, type);
            expect(result).toBe(false);
        });

        it('should return true for a valid MangaBaka ID', async () => {
            const id = "5258";
            const type = "mangabaka";
            const result = await checkID(id, type);
            expect(result).toBe(true);
        });

        it('should return false for an invalid MangaBaka ID', async () => {
            const id = "invalidID";
            const type = "mangabaka";
            const result = await checkID(id, type);
            expect(result).toBe(false);
        })

        it('should return null if no ID is provided', async () => {
            const id = null;
            const type = "namicomi";
            const result = await checkID(id, type);
            expect(result).toBeNull();
        });
    });
});