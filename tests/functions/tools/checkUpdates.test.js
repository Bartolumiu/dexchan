const checkUpdates = require('../../../src/functions/tools/checkUpdates');
const axios = require('axios');

jest.mock('axios');

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('checkUpdates', () => {
    beforeEach(() => {
        jest.resetModules(); // Reset module cache before each test
    });

    describe('latest > current', () => {
        it('should return isOutdated as true when the latest major is newer', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '2.0.0' } });
    
            jest.doMock('../../../package.json', () => ({ version: '1.0.0' }), { virtual: true });
    
            const result = await checkUpdates();
    
            expect(result.isOutdated).toBe(true);
            expect(result.latestVersion).toBe('2.0.0');
        });

        it('should return isOutdated as true when the latest minor is newer', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.1.0' } });
    
            jest.doMock('../../../package.json', () => ({ version: '1.0.0' }), { virtual: true });
    
            const result = await checkUpdates();
    
            expect(result.isOutdated).toBe(true);
            expect(result.latestVersion).toBe('1.1.0');
        });

        it('should return isOutdated as true when the latest patch is newer', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.0.1' } });
    
            jest.doMock('../../../package.json', () => ({ version: '1.0.0' }), { virtual: true });
    
            const result = await checkUpdates();
    
            expect(result.isOutdated).toBe(true);
            expect(result.latestVersion).toBe('1.0.1');
        });

        it('should return isOutdated as true when there is no pre-release and the current version is pre-release', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.0.0' } });
    
            jest.doMock('../../../package.json', () => ({ version: '1.0.0-beta' }), { virtual: true });
    
            const result = await checkUpdates();
    
            expect(result.isOutdated).toBe(true);
            expect(result.latestVersion).toBe('1.0.0');
        });

        it('should return isOutdated as true when the latest pre-release is "dev" and the current is "beta"', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.0.0-dev' } });
    
            jest.doMock('../../../package.json', () => ({ version: '1.0.0-beta' }), { virtual: true });
    
            const result = await checkUpdates();
    
            expect(result.isOutdated).toBe(true);
            expect(result.latestVersion).toBe('1.0.0-dev');
        });
    });

    describe('latest <= current', () => {
        it('should return isOutdated as false for the same version', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.0.0' } });
            
            jest.doMock('../../../package.json', () => ({ version: '1.0.0' }), { virtual: true });

            const result = await checkUpdates();

            expect(result.isOutdated).toBe(false);
            expect(result.latestVersion).toBe('1.0.0');
        });

        it('should return isOutdated as false when the latest major is older', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '0.1.0' } });
            
            jest.doMock('../../../package.json', () => ({ version: '1.0.0' }), { virtual: true });

            const result = await checkUpdates();

            expect(result.isOutdated).toBe(false);
            expect(result.latestVersion).toBe('0.1.0');
        });

        it('should return isOutdated as false when the latest minor is older', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.0.0' } });
            
            jest.doMock('../../../package.json', () => ({ version: '1.1.0' }), { virtual: true });

            const result = await checkUpdates();

            expect(result.isOutdated).toBe(false);
            expect(result.latestVersion).toBe('1.0.0');
        });

        it('should return isOutdated as false when the latest patch is older', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.0.0' } });
            
            jest.doMock('../../../package.json', () => ({ version: '1.0.1' }), { virtual: true });

            const result = await checkUpdates();

            expect(result.isOutdated).toBe(false);
            expect(result.latestVersion).toBe('1.0.0');
        });

        it('should return isOutdated as false when the latest pre-release is "beta" and the current is "dev"', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.0.0-beta' } });
            
            jest.doMock('../../../package.json', () => ({ version: '1.0.0-dev' }), { virtual: true });

            const result = await checkUpdates();

            expect(result.isOutdated).toBe(false);
            expect(result.latestVersion).toBe('1.0.0-beta');
        });

        it('should return isOutdated as false when the latest pre-release is the same as the current', async () => {
            axios.get.mockResolvedValue({ data: { tag_name: '1.0.0-beta' } });
            
            jest.doMock('../../../package.json', () => ({ version: '1.0.0-beta' }), { virtual: true });

            const result = await checkUpdates();

            expect(result.isOutdated).toBe(false);
            expect(result.latestVersion).toBe('1.0.0-beta');
        });
    });

    describe('parseVersionPart', () => {
        it('should return the integer value of a version part', () => {
            const { parseVersionPart } = require('../../../src/functions/tools/checkUpdates');

            expect(parseVersionPart('1')).toBe(1);
            expect(parseVersionPart('0')).toBe(0);
            expect(parseVersionPart('10')).toBe(10);
            expect(parseVersionPart('invalid')).toBe(0);
        });
    });

    it('should log an error and return null when the API call fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        axios.get.mockRejectedValue(new Error('API request failed'));

        const result = await checkUpdates();

        expect(result.isOutdated).toBeNull();
        expect(result.latestVersion).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[GitHub] Failed to check for updates: API request failed'));
        consoleErrorSpy.mockRestore();
    });
});
