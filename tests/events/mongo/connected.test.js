const connectedEvent = require('../../../src/events/mongo/connected');
const getChalk = require('../../../src/functions/tools/getChalk');

// Mock chalk module used by the event
jest.mock('chalk', () => {
    return {
        default: {
            green: (text) => text
        }
    };
});

describe('connected event', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should have the name "connected"', () => {
        expect(connectedEvent.name).toBe('connected');
    });

    it('should log the connection message in green', async () => {
        const chalk = await getChalk();
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await connectedEvent.execute();

        expect(consoleLogSpy).toHaveBeenCalledWith(chalk.green('[Database Status] Connected to MongoDB!'));
        consoleLogSpy.mockRestore();
    });
});