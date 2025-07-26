// Mock Discord.js
jest.mock('discord.js', () => ({
    Client: jest.fn().mockImplementation(function() {
        return {
            commands: new Map(),
            buttons: new Map(),
            selectMenus: new Map(),
            modals: new Map(),
            guildCommands: new Map(),
            globalCommands: [],
            version: undefined,
            user: {
                tag: 'Dex-chan#0000'
            },
            login: jest.fn().mockResolvedValue(),
            on: jest.fn()
        };
    }),
    Collection: jest.fn().mockImplementation(() => new Map())
}));

// Mock mongoose
jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue()
}));

// Mock handlers
jest.mock('../../src/functions/handlers/handleFunctions', () => jest.fn().mockResolvedValue());

// Mock getChalk
const mockChalk = {
    blueBright: jest.fn(msg => `[BLUE]${msg}[/BLUE]`),
    redBright: jest.fn(msg => `[RED]${msg}[/RED]`)
};
jest.mock('../../src/functions/tools/getChalk', () => jest.fn().mockResolvedValue(mockChalk));

// Mock package.json
jest.mock('../../package.json', () => ({
    version: '1.0.0'
}), { virtual: true });

describe('app.js - Application Module', () => {
    let app;
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        
        // Re-require the module to get a fresh instance
        delete require.cache[require.resolve('../../src/lib/app.js')];
        app = require('../../src/lib/app.js');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('createClient', () => {
        it('should create Discord client with correct configuration', () => {
            const { Client } = require('discord.js');
            const client = app.createClient();

            expect(Client).toHaveBeenCalledWith({ intents: 32767 });
            expect(client.commands).toBeInstanceOf(Map);
            expect(client.buttons).toBeInstanceOf(Map);
            expect(client.selectMenus).toBeInstanceOf(Map);
            expect(client.modals).toBeInstanceOf(Map);
            expect(client.guildCommands).toBeInstanceOf(Map);
            expect(Array.isArray(client.globalCommands)).toBe(true);
        });

        it('should set version from package.json', () => {
            const client = app.createClient();
            expect(client.version).toBe('1.0.0');
        });
    });

    describe('loadApplicationHandlers', () => {
        it('should load function handlers successfully', async () => {
            const mockClient = { test: 'client' };
            const handleFunctions = require('../../src/functions/handlers/handleFunctions');

            await app.loadApplicationHandlers(mockClient);

            expect(handleFunctions).toHaveBeenCalledWith(mockClient);
        });
    });

    describe('connectServices', () => {
        it('should connect to database successfully', async () => {
            const mongoose = require('mongoose');
            const dbToken = 'mongodb://test-connection';
            const token = 'discord-token';

            await app.connectServices(token, dbToken);

            expect(mongoose.connect).toHaveBeenCalledWith(dbToken);
        });
    });

    describe('logMessage', () => {
        it('should log message with chalk colors', async () => {
            const getChalk = require('../../src/functions/tools/getChalk');
            
            await app.logMessage('Test message');
            
            expect(getChalk).toHaveBeenCalled();
            expect(mockChalk.blueBright).toHaveBeenCalledWith('Test message');
            expect(consoleLogSpy).toHaveBeenCalledWith('[BLUE]Test message[/BLUE]');
        });

        it('should fallback to plain logging when chalk fails', async () => {
            const getChalk = require('../../src/functions/tools/getChalk');
            getChalk.mockRejectedValueOnce(new Error('Chalk failed'));
            
            await app.logMessage('Test message');
            
            expect(consoleLogSpy).toHaveBeenCalledWith('Test message');
        });
    });

    describe('logError', () => {
        it('should log error with chalk colors', async () => {
            const getChalk = require('../../src/functions/tools/getChalk');
            
            await app.logError('Error message');
            
            expect(getChalk).toHaveBeenCalled();
            expect(mockChalk.redBright).toHaveBeenCalledWith('Error message');
            expect(consoleLogSpy).toHaveBeenCalledWith('[RED]Error message[/RED]');
        });

        it('should fallback to plain logging when chalk fails', async () => {
            const getChalk = require('../../src/functions/tools/getChalk');
            getChalk.mockRejectedValueOnce(new Error('Chalk failed'));
            
            await app.logError('Error message');
            
            expect(consoleLogSpy).toHaveBeenCalledWith('Error message');
        });
    });

    describe('initializeApplication', () => {
        it('should initialize application successfully with valid config', async () => {
            const config = {
                token: 'discord-token',
                dbToken: 'mongodb://test-db'
            };

            const { Client } = require('discord.js');
            const mongoose = require('mongoose');
            const handleFunctions = require('../../src/functions/handlers/handleFunctions');

            const result = await app.initializeApplication(config);

            expect(Client).toHaveBeenCalledWith({ intents: 32767 });
            expect(mongoose.connect).toHaveBeenCalledWith(config.dbToken);
            expect(handleFunctions).toHaveBeenCalled();
            expect(result.login).toHaveBeenCalledWith(config.token);
        });
    });

    describe('module exports', () => {
        it('should export all required functions', () => {
            expect(typeof app.createClient).toBe('function');
            expect(typeof app.loadApplicationHandlers).toBe('function');
            expect(typeof app.connectServices).toBe('function');
            expect(typeof app.logMessage).toBe('function');
            expect(typeof app.logError).toBe('function');
            expect(typeof app.initializeApplication).toBe('function');
        });
    });
});
