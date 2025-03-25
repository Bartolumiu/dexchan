const getChalk = require("../../functions/tools/getChalk");

module.exports = {
    name: 'debug',
    async execute(info) {
        const chalk = await getChalk();
        console.log(chalk.gray(info));
    }
}