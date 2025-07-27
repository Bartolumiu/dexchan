const getChalk = require("../../functions/tools/getChalk");

module.exports = {
    name: 'connected',
    async execute() {
        const chalk = await getChalk();
        console.log(chalk.green('[Database Status] Connected to MongoDB!'));
    }
}