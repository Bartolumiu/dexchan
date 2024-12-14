const checkUpdates = require('../../functions/tools/checkUpdates');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        setInterval(client.pickPresence, 10 * 1000)
        const chalk = await import('chalk');
        console.log(chalk.default.greenBright(`[Discord] Ready as ${client.user.tag}`));
        console.log(chalk.default.greenBright(`[Discord] Version: ${client.version}`));

        // Check for updates
        console.log(chalk.default.blueBright('[GitHub] Checking for updates...'));
        const res = await checkUpdates();

        if (res.isOutdated) {
            console.warn(chalk.default.yellowBright(`[GitHub] The bot is outdated! Current version: ${client.version}, Latest version: ${res.latestVersion}`));
            console.log(chalk.default.yellowBright(`[GitHub] Download the latest version at https://github.com/Bartolumiu/dexchan_rework/releases/latest`));
        } else if (res.isOutdated === false) {
            console.log(chalk.default.greenBright('[GitHub] The bot is up-to-date!'));
        } // If res.isOutdated is null, the error message will be logged in the checkUpdates function itself, so no need to log it here
    }
}