jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');
const { getLocale, translateAttribute } = require('../../../src/functions/handlers/handleLocales');

const loadHandlerOnClient = () => {
    const client = {};
    require('../../../src/functions/handlers/handleLocales')(client);
    return client;
}

describe('handleLocales', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLocale', () => {
        it('should return the user preferred locale if available', () => {
            const userProfile = { preferredLocale: 'en' };
            const interaction = { locale: 'en-US' };
            const result = getLocale(userProfile, interaction);
            expect(result).toBe('en');
        });

        it('should return the interaction locale if user preferred locale is not available', () => {
            const userProfile = {};
            const interaction = { locale: 'en-US' };
            const result = getLocale(userProfile, interaction);
            expect(result).toBe('en-US');
        });
    });

    describe('translateAttribute', () => {
        it('should load locales and translate command attribute', async () => {
            const mockLocales = {
                'en': {
                    commands: {
                        testCommand: {
                            description: 'Test Description'
                        }
                    }
                },
                'es': {
                    commands: {
                        testCommand: {
                            description: 'Descripción de prueba'
                        }
                    }
                }
            };

            path.join.mockImplementation((...args) => args.join('/'));
            path.basename.mockImplementation((file) => file.split('.')[0]);

            fs.readdirSync.mockReturnValue(['en.json', 'es.json']);
            fs.readFileSync.mockImplementation((file, encoding) => {
                const locale = file.split('/').pop().split('.')[0];
                return JSON.stringify(mockLocales[locale]);
            });

            const result = await translateAttribute('testCommand', 'description');
            expect(result).toEqual({
                'en-GB': 'Test Description',
                'en-US': 'Test Description',
                'es-ES': 'Descripción de prueba',
                'es-419': 'Descripción de prueba'
            });
        });

        it('should return an empty object if no translations are found', async () => {
            fs.readdirSync.mockReturnValue(['en.json', 'es.json']);
            fs.readFileSync.mockImplementation(() => JSON.stringify({}));

            const translations = await translateAttribute('testCommand', 'description');
            expect(translations).toEqual({});
        });
    });

    describe('client', () => {
        let client;

        beforeEach(() => {
            jest.clearAllMocks();
            client = loadHandlerOnClient();
        });

        it('should return a translation with fallback to English (client.translate)', async () => {
            path.join.mockImplementation((...args) => args.join('/'));
            fs.readdirSync.mockReturnValue(['en.json']);
            fs.readFileSync.mockImplementation((filePath, encoding) => {
                return JSON.stringify({ commands: { testCommand: { description: 'Test Description2' } }  });
            });

            await client.handleLocales();
            const result = client.translate('en', 'commands', 'testCommand.description');
            expect(result).toBe('Test Description2');
        });

        it('should use the English translation if the requested locale does not exist (client.translate)', async () => {
            path.join.mockImplementation((...args) => args.join('/'));
            fs.readdirSync.mockReturnValue(['en.json']);
            fs.readFileSync.mockImplementation((filePath, encoding) => {
                return JSON.stringify({ commands: { testCommand: { description: 'Test Description2' } }  });
            });

            await client.handleLocales();
            const result = client.translate('es', 'commands', 'testCommand.description');
            expect(result).toBe('Test Description2');
        });

        it('should return the user preferred locale if set (client.getLocale)', () => {
            const userProfile = { preferredLocale: 'es' };
            const interaction = { locale: 'en-US' };
            const result = client.getLocale(userProfile, interaction);
            expect(result).toBe('es');
        });

        it('should return the interaction locale if user preferred locale is not set (client.getLocale)', () => {
            const userProfile = {};
            const interaction = { locale: 'en-US' };
            const result = client.getLocale(userProfile, interaction);
            expect(result).toBe('en-US');
        });

        it('should return the translation with replacements (client.translate)', async () => {
            path.join.mockImplementation((...args) => args.join('/'));
            fs.readdirSync.mockReturnValue(['en.json']);
            fs.readFileSync.mockImplementation((filePath, encoding) => {
                return JSON.stringify({ commands: { testCommand: { description: '%test% Description3' } }  });
            });

            await client.handleLocales();
            const result = client.translate('en', 'commands', 'testCommand.description', { test: 'Test' });
            expect(result).toBe('Test Description3');
        });

        it('should return null if the translation is not found (client.translate)', async () => {
            path.join.mockImplementation((...args) => args.join('/'));
            fs.readdirSync.mockReturnValue(['en.json']);
            fs.readFileSync.mockImplementation((filePath, encoding) => {
                return JSON.stringify({ commands: { testCommand: { description: 'Test Description4' } }  });
            });

            await client.handleLocales();
            const result = client.translate('en', 'commands', 'testCommand.description2');
            expect(result).toBeNull();
        });

        it('should handle array of translations (client.translate)', async () => {
            path.join.mockImplementation((...args) => args.join('/'));
            fs.readdirSync.mockReturnValue(['en.json']);
            fs.readFileSync.mockImplementation((filePath, encoding) => {
                return JSON.stringify({ commands: { testCommand: { fields: [{name: 'f1', value: 'Test Description5'}, {name: 'f2', value: 'Test Description6'}] } }  });
            });

            await client.handleLocales();
            const result1 = client.translate('en', 'commands', 'testCommand.fields[0].value');
            expect(result1).toBe('Test Description5');

            const result2 = client.translate('en', 'commands', 'testCommand.fields[1].value');
            expect(result2).toBe('Test Description6');
        });

        it('should return null if the nested translation is not found (client.translate)', async () => {
            path.join.mockImplementation((...args) => args.join('/'));
            fs.readdirSync.mockReturnValue(['en.json']);
            fs.readFileSync.mockImplementation((filePath, encoding) => {
                return JSON.stringify({ commands: { testCommand: { description: 'Test Description' } }  });
            });

            await client.handleLocales();
            const result = client.translate('en', 'commands', '.');
            expect(result).toBeNull();
        });
    });
});