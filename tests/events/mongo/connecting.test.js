const connecting = require("../../../src/events/mongo/connecting");
const getChalk = require("../../../src/functions/tools/getChalk");

jest.mock("../../../src/functions/tools/getChalk", () => jest.fn());

describe("Connecting Event", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should have a name property equal to 'connecting'", () => {
        expect(connecting.name).toBe("connecting");
    });

    it("should log the correct connecting message", async () => {
        const expectedMessage = "[Database Status] Connecting to MongoDB...";
        const mockCyan = jest.fn((msg) => msg);

        // Mock getChalk to return an object with a cyan function.
        getChalk.mockResolvedValue({ cyan: mockCyan });

        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        await connecting.execute();

        expect(getChalk).toHaveBeenCalled();
        expect(mockCyan).toHaveBeenCalledWith(expectedMessage);
        expect(consoleSpy).toHaveBeenCalledWith(expectedMessage);

        consoleSpy.mockRestore();
    });
});