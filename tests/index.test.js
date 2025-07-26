// Mock environment variables first
process.env.token = 'mock-discord-token';
process.env.dbToken = 'mock-db-token';

// Mock the app module
const mockInitializeApplication = jest.fn().mockResolvedValue();
jest.mock('../src/lib/app', () => ({
    initializeApplication: mockInitializeApplication
}));

// Mock dotenv
const mockDotenvConfig = jest.fn();
jest.mock('dotenv', () => ({
    config: mockDotenvConfig
}));

describe('index.js - Main Entry Point', () => {
    let consoleErrorSpy;
    let processExitSpy;

    beforeAll(() => {
        // Setup spies before loading the module
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        
        // Now require the module, which will execute immediately
        require('../src/index.js');
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    describe('successful initialization', () => {
        it('should configure dotenv', () => {
            expect(mockDotenvConfig).toHaveBeenCalled();
        });

        it('should call initializeApplication with correct config', () => {
            expect(mockInitializeApplication).toHaveBeenCalledWith({
                token: 'mock-discord-token',
                dbToken: 'mock-db-token'
            });
        });

        it('should not exit process on successful initialization', () => {
            expect(processExitSpy).not.toHaveBeenCalled();
        });

        it('should execute the main initialization flow', () => {
            expect(mockInitializeApplication).toHaveBeenCalledTimes(1);
        });
    });

    describe('module dependencies', () => {
        it('should require all necessary modules without errors', () => {
            expect(() => {
                require('dotenv');
                require('../src/lib/app');
            }).not.toThrow();
        });

        it('should export the expected module structure', () => {
            // Since index.js doesn't export anything, we just verify it loads
            expect(typeof require('../src/index.js')).toBe('object');
        });
    });
});

describe('index.js - Error Handling', () => {
    let consoleErrorSpy;
    let processExitSpy;

    beforeEach(() => {
        // Clear all mocks and module cache
        jest.clearAllMocks();
        jest.resetModules();
        
        // Setup spies
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        
        // Set environment variables
        process.env.token = 'mock-discord-token';
        process.env.dbToken = 'mock-db-token';
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    it('should handle initialization errors and exit process', async () => {
        // Mock the app module to reject for this test
        jest.doMock('../src/lib/app', () => ({
            initializeApplication: jest.fn().mockRejectedValue(new Error('Test initialization error'))
        }));
        
        // Mock dotenv
        jest.doMock('dotenv', () => ({
            config: jest.fn()
        }));
        
        // Require the modules (this will execute index.js)
        const { initializeApplication } = require('../src/lib/app');
        require('../src/index.js');
        
        // Wait for the promise to reject and error handler to execute
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(initializeApplication).toHaveBeenCalledWith({
            token: 'mock-discord-token',
            dbToken: 'mock-db-token'
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Application failed to start:', expect.any(Error));
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
});
