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

        User.findOne.mockResolvedValue(mockUserProfile);

        const result = await client.getMongoUserData(mockUser);

        expect(User.findOne).toHaveBeenCalledWith({ _id: mockUser.id });
        expect(result).toEqual(mockUserProfile);
    });

    it('should create a new user profile if user does not exist in the database', async () => {
        const mockUser = { id: '123', username: 'newuser' };
        const mockNewUser = { _id: '123', username: 'newuser', preferredLocale: null, save: jest.fn().mockResolvedValue(true) };

        User.findOne.mockResolvedValue(null);
        User.mockImplementation(() => mockNewUser);

        const result = await client.getMongoUserData(mockUser);

        expect(User.findOne).toHaveBeenCalledWith({ _id: mockUser.id });
        expect(User).toHaveBeenCalledWith({ _id: mockUser.id, username: mockUser.username, preferredLocale: null });
        expect(mockNewUser.save).toHaveBeenCalled();
        expect(result).toEqual(mockNewUser);
    });
});