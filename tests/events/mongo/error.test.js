const getChalk = require("../../../src/functions/tools/getChalk");
const errorEvent = require("../../../src/events/mongo/error");

jest.mock("../../../src/functions/tools/getChalk");


describe("error event", () => {
    let consoleLogSpy;
    const errorMessage = "Test error";

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should have name 'err'", () => {
        expect(errorEvent.name).toBe("err");
    });

    it("should log the error message with chalk red", async () => {
        const fakeChalk = {
            red: jest.fn((text) => `red: ${text}`)
        };
        getChalk.mockResolvedValue(fakeChalk);

        await errorEvent.execute(errorMessage);

        const expectedText = `[Database Status] Error:\n${errorMessage}`;
        expect(fakeChalk.red).toHaveBeenCalledWith(expectedText);
        expect(consoleLogSpy).toHaveBeenCalledWith(`red: ${expectedText}`);
    });
});