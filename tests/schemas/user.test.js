const mongoose = require('mongoose');
const User = require('../../src/schemas/user');

describe('User schema', () => {
    beforeEach(() => {
        jest.spyOn(User.prototype, 'save').mockImplementation(async function () {
            return this.toObject ? this.toObject() : { ...this }; 
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create and save a user successfully', async () => {
        const userData = {
            _id: '000000000000000000000000',
            username: 'test-user',
            preferredLocale: null
        };
        const user = new User(userData);
        const saved = await user.save();

        expect(saved).toEqual(userData);
        expect(saved.preferredLocale).toBeNull();
        expect(User.prototype.save).toHaveBeenCalledTimes(1);
    });

    it('should allow setting preferredLocale to a value', async () => {
        const userData = {
            _id: '000000000000000000000000',
            username: 'test-user',
            preferredLocale: 'en'
        };
        const user = new User(userData);
        const saved = await user.save();

        expect(saved).toEqual(userData);
        expect(saved.preferredLocale).toEqual('en');
        expect(User.prototype.save).toHaveBeenCalledTimes(1);
    });
});
