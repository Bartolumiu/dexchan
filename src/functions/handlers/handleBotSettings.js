const Bot = require('../../schemas/bot');

module.exports = (client) => {
    client.getMongoBotData = async () => {
        return getBotData(client);
    };
};

const getBotData = async (client) => {
    const update = {
        $setOnInsert: {
            _id: client.user.id,
            name: client.user.username,
            settings: {
                commands: client.commands.map((cmd) => {
                    return {
                        name: cmd.data.name,
                        enabled: true,
                        global: cmd.global || false,
                        guildID: cmd.guildID || []
                    };
                }),
                sources: []
            }
        }
    };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };

    try {
        return await Bot.findOneAndUpdate({_id: client.user.id}, update, options);
    } catch (err) {
        if (err?.code === 11000 || err?.name === 'MongoServerError') {
            return await Bot.findOne({ _id: client.user.id });
        }
        throw err;
    }
}