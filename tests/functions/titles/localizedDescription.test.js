const getLocalizedDescription = require('../../../src/functions/titles/localizedDescription');

describe('getLocalizedDescription', () => {
    describe('MangaDex', () => {
        it('should return an english description for en-US locale (mapped to "en")', () => {
            const title = {
                attributes: {
                    description: { en: "English description", es: "Spanish description", "es-la": "Spanish (LA) description" }
                }
            };
            expect(getLocalizedDescription(title, 'mangadex', 'en-US')).toBe("English description");
        });

        it('should return a Spanish description when available for es-ES (mapped to "es")', () => {
            const title = {
                attributes: {
                    description: { es: "Spanish description", en: "English description", "es-la": "Spanish (LA) description" }
                }
            };
            expect(getLocalizedDescription(title, 'mangadex', 'es-ES')).toBe("Spanish description");
        });

        it('should fall back to es-la if es description is missing for es-ES (mapped to "es")', () => {
            const title = {
                attributes: {
                    description: { "es-la": "Spanish (LA) description", en: "English description" }
                }
            };
            expect(getLocalizedDescription(title, 'mangadex', 'es-ES')).toBe("Spanish (LA) description");
        });

        it('should fall back to English if neither es nor es-la is available for es-ES', () => {
            const title = {
                attributes: {
                    description: { en: "English description" }
                }
            };
            expect(getLocalizedDescription(title, 'mangadex', 'es-ES')).toBe("English description");
        });
    });

    describe('NamiComi', () => {
        it('should return an English description for en-US locale (mapped to "en")', () => {
            const title = {
                attributes: {
                    description: { en: "English description", es: "Spanish description", "es-419": "Spanish (419) description" }
                }
            };
            expect(getLocalizedDescription(title, 'namicomi', 'en-US')).toBe("English description");
        });

        it('should return a Spanish description when available for es-ES (mapped to "es")', () => {
            const title = {
                attributes: {
                    description: { es: "Spanish description", en: "English description", "es-419": "Spanish (419) description" }
                }
            };
            expect(getLocalizedDescription(title, 'namicomi', 'es-ES')).toBe("Spanish description");
        });

        it('should fall back to es-419 if es description is missing for es-ES (mapped to "es")', () => {
            const title = {
                attributes: {
                    description: { "es-419": "Spanish (419) description", en: "English description" }
                }
            };
            expect(getLocalizedDescription(title, 'namicomi', 'es-ES')).toBe("Spanish (419) description");
        });

        it('should fall back to english if neither es nor es-419 is available for es-ES', () => {
            const title = {
                attributes: {
                    description: { en: "English description" }
                }
            };
            expect(getLocalizedDescription(title, 'namicomi', 'es-ES')).toBe("English description");
        });
    });

    it('should return undefined for an unknown type', () => {
        const title = { attributes: { description: { en: "English description" } } };
        expect(getLocalizedDescription(title, 'unknown', 'en')).toBeUndefined();
    });

    it('should return null if description is missing for both types', () => {
        const title = { attributes: { description: {} } };
        expect(getLocalizedDescription(title, 'mangadex', 'en-US')).toBeNull();
        expect(getLocalizedDescription(title, 'namicomi', 'en-US')).toBeNull();
    });
});