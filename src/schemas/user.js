const { Schema, model } = require('mongoose');
const userSchema = new Schema({
    _id: Schema.Types.ObjectId,
    userID: { type: String, required: true },
    username: { type: String, required: true },
    preferredLocale: { type: String, default: null }
}, {
    versionKey: false
});

module.exports = model('User', userSchema, 'users');