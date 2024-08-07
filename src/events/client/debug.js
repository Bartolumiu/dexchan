module.exports = {
    name: 'debug',
    async execute(info) {
        const chalk = await import('chalk');
        console.log(chalk.default.gray(info));
    }
}