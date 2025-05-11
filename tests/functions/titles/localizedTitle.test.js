const getLocalizedTitle = require('../../../src/functions/titles/localizedTitle');

describe('getLocalizedTitle', () => {
    describe('MangaDex', () => {
        it('should return the first available title irrespective of locale', () => {
            const title = {
                attributes: {
                    title: {
                        en: "English Title",
                        ja: "Japanese Title"
                    }
                }
            };
            // Even if locale is "en-US", we expect the first key's value ("en")
            const result = getLocalizedTitle(title, 'mangadex', 'en-US');
            expect(result).toBe("English Title");
        });
        
        it('should return null if no title is available', () => {
            const title = {
                attributes: {
                    title: {}
                }
            };
            const result = getLocalizedTitle(title, 'mangadex', 'en');
            expect(result).toBeNull();
        });
    });

    describe('NamiComi', () => {
        it('should return the title matching the provided locale if available', () => {
            const title = {
                attributes: {
                    title: {
                        "es-es": "Título en Español",
                        "en": "English Title",
                        "es-419": "Título Latinoamericano"
                    }
                }
            };
            const result = getLocalizedTitle(title, 'namicomi', 'es');
            expect(result).toBe("Título en Español");
        });

        it('should fallback to "es-419" when locale is "es" and "es" title is missing', () => {
            const title = {
                attributes: {
                    title: {
                        "es-419": "Título Latinoamericano",
                        "en": "English Title"
                    }
                }
            };
            const result = getLocalizedTitle(title, 'namicomi', 'es');
            expect(result).toBe("Título Latinoamericano");
        });

        it('should fallback to "en" when neither locale nor "es-419" exists for locale "es"', () => {
            const title = {
                attributes: {
                    title: {
                        "en": "English Title",
                        "fr": "Titre Français"
                    }
                }
            };
            const result = getLocalizedTitle(title, 'namicomi', 'es');
            expect(result).toBe("English Title");
        });

        it('should fallback to the first available title if no preferred locale keys exist', () => {
            const title = {
                attributes: {
                    title: {
                        "fr": "Titre Français",
                        "de": "Deutscher Titel"
                    }
                }
            };
            const result = getLocalizedTitle(title, 'namicomi', 'it');
            // The first key in the object is "fr" as inserted.
            expect(result).toBe("Titre Français");
        });

        it('should map locale codes using the languageMap for "namicomi"', () => {
            const title = {
                attributes: {
                    title: {
                        "en": "English Title"
                    }
                }
            };
            // "en-US" should be mapped to "en"
            const result = getLocalizedTitle(title, 'namicomi', 'en-US');
            expect(result).toBe("English Title");
        });

        it('should return null if no title is available for NamiComi (impossible case)', () => {
            const title = {
                attributes: {
                    title: {}
                }
            };
            const result = getLocalizedTitle(title, 'namicomi', 'en');
            expect(result).toBeNull();
        });
    });

    describe('unsupported type', () => {
        it('should return undefined for an unsupported title type', () => {
            const title = {
                attributes: {
                    title: {
                        "en": "English Title"
                    }
                }
            };
            const result = getLocalizedTitle(title, 'unsupported', 'en');
            expect(result).toBeUndefined();
        });
    });
});