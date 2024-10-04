module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        setInterval(client.pickPresence, 10 * 1000)
        const chalk = await import('chalk');
        console.log(chalk.default.greenBright(`[Event Handler] Ready as ${client.user.tag}`));
        console.log(chalk.default.greenBright(`[Event Handler] Version: ${client.version}`));
    }
}