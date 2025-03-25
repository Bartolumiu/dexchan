const getChalk = require("../../functions/tools/getChalk");

module.exports = {
    name: 'connecting',
    async execute() {
        const chalk = await getChalk();
        console.log(chalk.cyan('[Database Status] Connecting to MongoDB...'));
    }
}