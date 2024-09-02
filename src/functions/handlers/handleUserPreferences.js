const User = require('../../schemas/user');

module.exports = (client) => {
    client.getMongoUserData = async (user) => {
        return getUserData(user);
    }
}

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