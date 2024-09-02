const { Schema, model } = require('mongoose');
const userSchema = new Schema({
    _id: { type: String, required: true },
    username: { type: String, required: true },
    preferredLocale: { type: String, default: null }
}, {
    _id: false,
    versionKey: false,
    timestamps: true
});

module.exports = model('User', userSchema, 'users');