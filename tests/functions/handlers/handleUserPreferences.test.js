const handleUserPreferences = require('../../../src/functions/handlers/handleUserPreferences');
const User = require('../../../src/schemas/user');

jest.mock('../../../src/schemas/user');

describe('handleUserPreferences', () => {
    let client;

    beforeEach(() => {
        client = {};
        handleUserPreferences(client);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should retrieve existing user data from the database', async () => {
        const mockUser = { id: '123', username: 'testuser' };
        const mockUserProfile = { _id: '123', username: 'testuser', preferredLocale: 'en' };

        User.findOneAndUpdate.mockResolvedValue(mockUserProfile);

        const result = await client.getMongoUserData(mockUser);

        expect(User.findOneAndUpdate).toHaveBeenCalled();
        expect(result).toEqual(mockUserProfile);
    });

    it('should create a new user profile when one does not exist (upsert)', async () => {
        const mockUser = { id: '123', username: 'newuser' };
        const mockNewUser = { _id: '123', username: 'newuser', preferredLocale: null };

        User.findOneAndUpdate.mockResolvedValue(mockNewUser);

        const result = await client.getMongoUserData(mockUser);

        expect(User.findOneAndUpdate).toHaveBeenCalled();
        expect(result).toEqual(mockNewUser);
    });

    it('should fallback to findOne when findOneAndUpdate throws a duplicate key error', async () => {
        const mockUser = { id: '123', username: 'concurrent' };
        const existingUser = { _id: '123', username: 'concurrent', preferredLocale: 'es' };

        const dupErr = new Error('E11000 duplicate key error');
        dupErr.code = 11000;
        dupErr.name = 'MongoServerError';

        User.findOneAndUpdate.mockRejectedValue(dupErr);
        User.findOne.mockResolvedValue(existingUser);

        const result = await client.getMongoUserData(mockUser);

        expect(User.findOneAndUpdate).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalledWith({ _id: mockUser.id });
        expect(result).toEqual(existingUser);
    });

    it('should rethrow unknown errors from findOneAndUpdate', async () => {
        const mockUser = { id: '999', username: 'bad' };
        const unexpected = new Error('unexpected failure');

        User.findOneAndUpdate.mockRejectedValue(unexpected);

        await expect(client.getMongoUserData(mockUser)).rejects.toBe(unexpected);
    });
});