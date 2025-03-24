const fs = require('fs');
const { connection } = require('mongoose');
const initHandlers = require('../../../src/functions/handlers/handleEvents.js');
const clientEvent = require('../../../src/events/client/clientEvent.js');
const mongoEvent = require('../../../src/events/mongo/mongoEvent.js');

// Set up dummy event modules
jest.mock('../../../src/events/client/clientEvent.js', () => ({
    name: 'clientEvent',
    once: true,
    execute: jest.fn(),
}), { virtual: true });

jest.mock('../../../src/events/mongo/mongoEvent.js', () => ({
    name: 'mongoEvent',
    once: false,
    execute: jest.fn(),
}), { virtual: true });

// Mock fs
jest.mock('fs', () => ({
    readdirSync: jest.fn(),
}));

// Mock mongoose connection
jest.mock('mongoose', () => ({
    connection: {
        on: jest.fn(),
        once: jest.fn(),
    },
}));

// Clear mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Import our handler initialization function

describe('handleEvents', () => {
    it('should register client events correctly', async () => {
        // Setup fs mocks for client events only
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/events') return ['client'];
            if (path === './src/events/client') return ['clientEvent.js'];
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
        expect(eventName).toBe('clientEvent');

        // Simulate invoking the event callback
        const dummyArg = 'testArg';
        await callback(dummyArg);
        expect(clientEvent.execute).toHaveBeenCalledWith(dummyArg, client);
    });

    it('should register mongo events correctly', async () => {
        // Setup fs mocks for mongo events only
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/events') return ['mongo'];
            if (path === './src/events/mongo') return ['mongoEvent.js'];
            return [];
        });
        // Create fake client (its methods aren’t used by mongo events)
        const client = {
            on: jest.fn(),
            once: jest.fn(),
        };

        initHandlers(client);
        await client.handleEvents();

        // For mongo events, since once is false, connection.on should be called
        expect(connection.on).toHaveBeenCalledTimes(1);
        const [eventName, callback] = connection.on.mock.calls[0];
        expect(eventName).toBe('mongoEvent');

        // Simulate invoking the mongo event callback
        const dummyArg = 'mongoArg';
        await callback(dummyArg);
        expect(mongoEvent.execute).toHaveBeenCalledWith(dummyArg, client);
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

    it('should register client events correctly when event.once is false', async () => {
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/events') return ['client'];
            if (path === './src/events/client') return ['clientOnEvent.js'];
            return [];
        });

        jest.mock('../../../src/events/client/clientOnEvent.js', () => ({
            name: 'clientOnEvent',
            once: false,
            execute: jest.fn(),
        }), { virtual: true });

        const client = {
            on: jest.fn(),
            once: jest.fn(),
        };

        initHandlers(client);
        await client.handleEvents();

        expect(client.on).toHaveBeenCalledTimes(1);
        const [eventName, callback] = client.on.mock.calls[0];
        expect(eventName).toBe('clientOnEvent');

        const dummyArg = 'testArg';
        await callback(dummyArg);

        const clientOnEvent = require('../../../src/events/client/clientOnEvent.js');
        expect(clientOnEvent.execute).toHaveBeenCalledWith(dummyArg, client);
    });

    it('should register mongo events correctly when event.once is false', async () => {
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/events') return ['mongo'];
            if (path === './src/events/mongo') return ['mongoOnEvent.js'];
            return [];
        });

        jest.mock('../../../src/events/mongo/mongoOnEvent.js', () => ({
            name: 'mongoOnEvent',
            once: false,
            execute: jest.fn(),
        }), { virtual: true });

        const client = {
            on: jest.fn(),
            once: jest.fn(),
        };

        initHandlers(client);
        await client.handleEvents();

        expect(connection.on).toHaveBeenCalledTimes(1);
        const [eventName, callback] = connection.on.mock.calls[0];
        expect(eventName).toBe('mongoOnEvent');

        const dummyArg = 'mongoArg';
        await callback(dummyArg);

        const mongoOnEvent = require('../../../src/events/mongo/mongoOnEvent.js');
        expect(mongoOnEvent.execute).toHaveBeenCalledWith(dummyArg, client);
    });

    it('should register mongo events correctly when event.once is true', async () => {
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/events') return ['mongo'];
            if (path === './src/events/mongo') return ['mongoOnceEvent.js'];
            return [];
        });

        jest.mock('../../../src/events/mongo/mongoOnceEvent.js', () => ({
            name: 'mongoOnceEvent',
            once: true,
            execute: jest.fn(),
        }), { virtual: true });

        const client = {
            on: jest.fn(),
            once: jest.fn(),
        };

        initHandlers(client);
        await client.handleEvents();

        expect(connection.once).toHaveBeenCalledTimes(1);
        const [eventName, callback] = connection.once.mock.calls[0];
        expect(eventName).toBe('mongoOnceEvent');

        const dummyArg = 'mongoOnceArg';
        await callback(dummyArg);

        const mongoOnceEvent = require('../../../src/events/mongo/mongoOnceEvent.js');
        expect(mongoOnceEvent.execute).toHaveBeenCalledWith(dummyArg, client);
    });
});