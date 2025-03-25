const disconnected = require("../../../src/events/mongo/disconnected");
const getChalk = require("../../../src/functions/tools/getChalk");

jest.mock('../../../src/functions/tools/getChalk', () => jest.fn());

describe("Disconnected Event", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should have a name property equal to 'disconnected'", () => {
        expect(disconnected.name).toBe("disconnected");
    });

    it("should log the correct disconnected message", async () => {
        const expectedMessage = "[Database Status] Disconnected from MongoDB!";
        const mockRed = jest.fn((msg) => msg);

        // Mock getChalk to return an object with a red function.
        getChalk.mockResolvedValue({ red: mockRed });

        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        await disconnected.execute();

        expect(getChalk).toHaveBeenCalled();
        expect(mockRed).toHaveBeenCalledWith(expectedMessage);
        expect(consoleSpy).toHaveBeenCalledWith(expectedMessage);

        consoleSpy.mockRestore();
    });
});