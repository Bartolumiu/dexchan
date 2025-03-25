const getChalk = require('../../functions/tools/getChalk');

module.exports = {
    name: 'disconnected',
    async execute() {
        const chalk = await getChalk();
        console.log(chalk.red('[Database Status] Disconnected from MongoDB!'));
    }
}