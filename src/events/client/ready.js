const checkUpdates = require('../../functions/tools/checkUpdates');
const getChalk = require('../../functions/tools/getChalk');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        setInterval(client.pickPresence, 10 * 1000)
        const chalk = await getChalk();

        // Check for updates
        console.log(chalk.blueBright('[GitHub] Checking for updates...'));
        const res = await checkUpdates();

        if (res.isOutdated) {
            console.warn(chalk.yellowBright(`[GitHub] The bot is outdated! Current version: ${client.version}, Latest version: ${res.latestVersion}`));
            console.log(chalk.yellowBright(`[GitHub] Download the latest version at https://github.com/Bartolumiu/dexchan_rework/releases/latest`));
        } else if (res.isOutdated === false) {
            console.log(chalk.greenBright('[GitHub] The bot is up-to-date!'));
        } // If res.isOutdated is null, the error message will be logged in the checkUpdates function itself, so no need to log it here
    }
}