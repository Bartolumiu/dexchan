module.exports = {
    name: 'connected',
    async execute() {
        const chalk = await import('chalk');
        console.log(chalk.default.green('[Database Status] Connected to MongoDB!'));
    }
}