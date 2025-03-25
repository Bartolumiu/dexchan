const getChalk = require('../../../src/functions/tools/getChalk');
const debugEvent = require('../../../src/events/client/debug');

jest.mock('../../../src/functions/tools/getChalk');

describe('Debug Event', () => {
    let consoleLogSpy;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should have a name property equal to "debug"', () => {
        expect(debugEvent.name).toBe('debug');
    });

    it('should log the debug message with chalk gray', async () => {
        const debugMessage = 'Test debug message';
        const mockGray = jest.fn((msg) => msg);

        getChalk.mockResolvedValue({ gray: mockGray });

        await debugEvent.execute(debugMessage);

        expect(getChalk).toHaveBeenCalled();
        expect(mockGray).toHaveBeenCalledWith(debugMessage);
        expect(consoleLogSpy).toHaveBeenCalledWith(debugMessage);
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
});