module.exports = {
    name: 'connecting',
    async execute() {
        const chalk = await import('chalk');
        console.log(chalk.default.cyan('[Database Status] Connecting to MongoDB...'));
    }
}