const handleBotSettings = require('../../../src/functions/handlers/handleBotSettings');
const Bot = require('../../../src/schemas/bot');

jest.mock('../../../src/schemas/bot');

describe('handleBotSettings', () => {
    let client;

    beforeEach(() => {
        client = {
            user: {
                id: '0',
                username: 'Dex-chan'
            },
            commands: [
                {
                    data: { name: 'search' },
                    global: true
                },
                {
                    data: { name: 'test' },
                    guildID: ['123']
                }
            ]
        };
        handleBotSettings(client);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call findOneAndUpdate with correct bot data mapping', async () => {
        const mockBotProfile = { _id: '0', settings: { commands: [] } };
        Bot.findOneAndUpdate.mockResolvedValue(mockBotProfile);

        const result = await client.getMongoBotData();

        // Verify the mapping logic for commands
        expect(Bot.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: client.user.id },
            expect.objectContaining({
                $setOnInsert: expect.objectContaining({
                    _id: client.user.id,
                    name: 'Dex-chan',
                    settings: {
                        commands: [
                            { name: 'search', enabled: true, global: true, guildID: [] },
                            { name: 'test', enabled: true, global: false, guildID: ['123'] }
                        ],
                        sources: []
                    }
                })
            }),
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        expect(result).toEqual(mockBotProfile);
    });

    it('should fallback to findOne on duplicate key error (MongoDB Race Condition)', async () => {
        const existingBot = { _id: '0', name: 'Dex-chan' };

        const dupErr = new Error('E11000 duplicate key error');
        dupErr.code = 11000;
        dupErr.name = 'MongoServerError';

        Bot.findOneAndUpdate.mockRejectedValue(dupErr);
        Bot.findOne.mockResolvedValue(existingBot);

        const result = await client.getMongoBotData();

        expect(Bot.findOneAndUpdate).toHaveBeenCalled();
        expect(Bot.findOne).toHaveBeenCalledWith({ _id: client.user.id });
        expect(result).toEqual(existingBot);
    });

    it('should rethrow errors that are not duplicate key errors', async () => {
        const genericError = new Error('Database connection lost');
        Bot.findOneAndUpdate.mockRejectedValue(genericError);

        await expect(client.getMongoBotData()).rejects.toThrow('Database connection lost');
    });

    it('should use findOne if error name is MongoServerError even without code 11000', async () => {
        const existingBot = { _id: '0' };
        const mongoErr = new Error('Some Mongo Server Error');
        mongoErr.name = 'MongoServerError';

        Bot.findOneAndUpdate.mockRejectedValue(mongoErr);
        Bot.findOne.mockResolvedValue(existingBot);

        const result = await client.getMongoBotData();

        expect(Bot.findOne).toHaveBeenCalled();
        expect(result).toEqual(existingBot);
    });
})