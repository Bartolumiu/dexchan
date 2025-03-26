const getChalk = require('../../../src/functions/tools/getChalk');
const { execute } = require('../../../src/events/client/ready');
const checkUpdates = require('../../../src/functions/tools/checkUpdates');

jest.mock('../../../src/functions/tools/getChalk');
jest.mock('../../../src/functions/tools/checkUpdates');

describe('Ready Event', () => {
    let consoleLogSpy;
    let consoleWarnSpy;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        setInterval = jest.fn((callback, interval) => {
            callback(); // Call the callback immediately for testing purposes
            return 1; // Return a mock interval ID
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should log a message when the client is ready', async () => {
        const client = {
            user: { tag: 'TestUser' },
            version: '0.0.0',
            pickPresence: jest.fn(),
        };

        const mockGreenBright = jest.fn((msg) => msg);
        const mockBlueBright = jest.fn((msg) => msg);

        getChalk.mockResolvedValue({
            greenBright: mockGreenBright,
            blueBright: mockBlueBright
        });
        checkUpdates.mockResolvedValue({ isOutdated: false, latestVersion: '0.0.0' });

        await execute(client);

        expect(getChalk).toHaveBeenCalled();
        expect(mockGreenBright).toHaveBeenCalledWith(`[Discord] Ready as ${client.user.tag}`);
        expect(mockGreenBright).toHaveBeenCalledWith(`[Discord] Version: ${client.version}`);
        expect(mockBlueBright).toHaveBeenCalledWith('[GitHub] Checking for updates...');
        expect(consoleLogSpy).toHaveBeenCalledTimes(4);
        expect(client.pickPresence).toHaveBeenCalledTimes(1);
    });

    it('should log an outdated message when the bot is outdated', async () => {
        const client = {
            user: { tag: 'TestUser' },
            version: '0.0.0',
            pickPresence: jest.fn(),
        };

        const mockGreenBright = jest.fn((msg) => msg);
        const mockYellowBright = jest.fn((msg) => msg);
        const mockBlueBright = jest.fn((msg) => msg);

        getChalk.mockResolvedValue({
            greenBright: mockGreenBright,
            blueBright: mockBlueBright,
            yellowBright: mockYellowBright,
        });
        checkUpdates.mockResolvedValue({ isOutdated: true, latestVersion: '0.0.1' });

        await execute(client);

        expect(getChalk).toHaveBeenCalled();
        expect(mockBlueBright).toHaveBeenCalledWith('[GitHub] Checking for updates...');
        expect(mockGreenBright).toHaveBeenCalledWith(`[Discord] Ready as ${client.user.tag}`);
        expect(mockGreenBright).toHaveBeenCalledWith(`[Discord] Version: ${client.version}`);
        expect(mockYellowBright).toHaveBeenCalledWith('[GitHub] The bot is outdated! Current version: 0.0.0, Latest version: 0.0.1');
        expect(consoleLogSpy).toHaveBeenCalledTimes(4);
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should not log an outdated message when the checkUpdates function returns null', async () => {
        const client = {
            user: { tag: 'TestUser' },
            version: '0.0.0',
            pickPresence: jest.fn(),
        };

        const mockGreenBright = jest.fn((msg) => msg);
        const mockBlueBright = jest.fn((msg) => msg);

        getChalk.mockResolvedValue({
            greenBright: mockGreenBright,
            blueBright: mockBlueBright,
        });
        checkUpdates.mockResolvedValue({ isOutdated: null });

        await execute(client);

        expect(getChalk).toHaveBeenCalled();
        expect(mockBlueBright).toHaveBeenCalledWith('[GitHub] Checking for updates...');
        expect(mockGreenBright).toHaveBeenCalledWith(`[Discord] Ready as ${client.user.tag}`);
        expect(mockGreenBright).toHaveBeenCalledWith(`[Discord] Version: ${client.version}`);
        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });
});