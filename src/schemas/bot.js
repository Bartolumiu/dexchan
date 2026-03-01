const { Schema, model } = require('mongoose');
const botSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    settings: {
        commands: [{
            name: { type: String, required: true },
            enabled: { type: Boolean, default: true },
            global: { type: Boolean, default: false },
            guildID: { type: [String], default: [] }
        }],
        sources: {
            type: [{
                name: {
                    type: String,
                    required: true
                },
                enabled: {
                    type: Boolean,
                    default: false
                }
            }],
            default: []
        }
    }
}, {
    _id: false,
    versionKey: false,
    timestamps: true
});

module.exports = model('Bot', botSchema, 'bots');