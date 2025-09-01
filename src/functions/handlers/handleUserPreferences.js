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
    // Use an atomic upsert to avoid race conditions where two parallel
    // requests try to create the same user and one of them fails with
    // a duplicate key error. $setOnInsert ensures fields are only set
    // when a new document is inserted.
    const update = {
        $setOnInsert: {
            _id: user.id,
            username: user.username,
            preferredLocale: null
        }
    };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };

    try {
        const userProfile = await User.findOneAndUpdate({ _id: user.id }, update, options);
        return userProfile;
    } catch (err) {
        // If a duplicate key error still occurs (very unlikely with upsert),
        // fall back to fetching the existing document.
        if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
            return await User.findOne({ _id: user.id });
        }
        throw err;
    }
}