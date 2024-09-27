const User = require('../../schemas/user');

/**
 * Adds a method to the client to retrieve user data from the database.
 * @param {*} client - The Discord client instance.
 */
module.exports = (client) => {
    /**
     * Retrieves user data from the database.
     * @param {*} user - The user object containing user details.
     * @returns {Promise<Object>} - A promise that resolves to the user profile object.
     */
    client.getMongoUserData = async (user) => {
        return getUserData(user);
    }
}


/**
 * Retrieves user data from the database. If the user does not exist, a new user profile is created and saved.
 *
 * @param {Object} user - The user object containing user details.
 * @param {string} user.id - The unique identifier of the user.
 * @param {string} user.username - The username of the user.
 * @returns {Promise<Object>} - A promise that resolves to the user profile object.
 */
async function getUserData(user) {
    const userProfile = await User.findOne({ _id: user.id });
    if (!userProfile) {
        const newUser = new User({
            _id: user.id,
            username: user.username,
            preferredLocale: null
        });
        await newUser.save();
        return newUser;
    }
    return userProfile;
}