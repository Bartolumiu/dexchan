const getChalk = require("../../functions/tools/getChalk");

module.exports = {
    name: 'err',
    async execute(err) {
        const chalk = await getChalk();
        console.log(chalk.red(`[Database Status] Error:\n${err}`));
    }
}