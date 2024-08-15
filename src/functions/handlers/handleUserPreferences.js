const User = require('../../schemas/user');
const mongoose = require('mongoose');

module.exports = (client) => {
    client.getMongoUserData = async (user) => {
        return getUserData(user);
    }
}

async function getUserData(user) {
    const userProfile = await User.findOne({ userID: user.id });
    if (!userProfile) {
        const newUser = new User({
            _id: mongoose.Types.ObjectId(),
            userID: user.id,
            username: user.username,
            preferredLocale: null
        });
        await newUser.save();
        return newUser;
    }
    return userProfile;
}