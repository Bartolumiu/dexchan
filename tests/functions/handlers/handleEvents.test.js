const fs = require('node:fs');
const { connection } = require('mongoose');
const initHandlers = require('../../../src/functions/handlers/handleEvents');

const readyEvent = require('../../../src/events/client/ready');
const interactionCreateEvent = require('../../../src/events/client/interactionCreate');

// Mock event files
jest.mock('../../../src/events/client/ready', () => ({
    name: 'ready',
    once: true,
    execute: jest.fn(),
}));

jest.mock('../../../src/events/client/interactionCreate', () => ({
    name: 'interactionCreate',
    once: false,
    execute: jest.fn(),
}));

// Mock fs
jest.mock('node:fs', () => ({
    readdirSync: jest.fn(),
}));

// Clear mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

describe('handleEvents', () => {
    it('should register client events correctly', async () => {
        // Setup fs mocks for client events only
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/events') return ['client'];
            if (path === './src/events/client') return ['ready.js'];
            return [];
        });
        // Create fake client with jest.fn() for on and once
        const client = {
            on: jest.fn(),
            once: jest.fn(),
        };

        // Initialize event handler on client
        initHandlers(client);
        await client.handleEvents();

        // Expect client.once to be called for our once event
        expect(client.once).toHaveBeenCalledTimes(1);
        const [eventName, callback] = client.once.mock.calls[0];
        expect(eventName).toBe('ready');

        // Simulate invoking the event callback
        const dummyArg = 'testArg';
        await callback(dummyArg);
        expect(readyEvent.execute).toHaveBeenCalledWith(dummyArg, client);
    });

    it('should register client events correctly when event.once is false', async () => {
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/events') return ['client'];
            if (path === './src/events/client') return ['interactionCreate.js'];
            return [];
        });

        const client = {
            on: jest.fn(),
            once: jest.fn(),
        };

        initHandlers(client);
        await client.handleEvents();

        expect(client.on).toHaveBeenCalledTimes(1);
        const [eventName, callback] = client.on.mock.calls[0];
        expect(eventName).toBe('interactionCreate');

        const dummyArg = 'testArg';
        await callback(dummyArg);
        expect(interactionCreateEvent.execute).toHaveBeenCalledWith(dummyArg, client);
    });

    it('should log errors for invalid event folders', async () => {
        // Setup fs mocks to include an invalid folder
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/events') return ['invalidFolder'];
            if (path === './src/events/invalidFolder') return ['someEvent.js'];
            return [];
        });
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const client = {
            on: jest.fn(),
            once: jest.fn(),
        };

        initHandlers(client);
        await client.handleEvents();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[Event Handler] Error: invalidFolder is not a valid event folder.'
        );
        consoleErrorSpy.mockRestore();
    });
});