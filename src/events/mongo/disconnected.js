module.exports = {
    name: 'disconnected',
    async execute() {
        const chalk = await import('chalk');
        console.log(chalk.default.red('[Database Status] Disconnected from MongoDB!'));
    }
}