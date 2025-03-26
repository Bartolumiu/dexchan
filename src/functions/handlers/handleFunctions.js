const { readdirSync } = require('fs');
const getChalk = require('../tools/getChalk');

const loadFunctions = async (client) => {
    const chalk = await getChalk();
    console.log(chalk.blueBright('[Function Loader] Loading functions...'));

    const skipCheck = [
        'checkUpdates',
        'urlParser',
        'handleFunctions',
        'capitalizeFirstLetter',
        'titleSearch',
        'titleDetails',
        'titleStats',
        'titleCover',
        'titleBanner'
    ];

    const functionFolders = readdirSync('./src/functions');
    for (const folder of functionFolders) {
        const functions = readdirSync(`./src/functions/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of functions) {
            await loadFunction(client, folder, file, skipCheck, chalk);
        }
    }
};

const loadFunction = async (client, folder, file, skipCheck, chalk) => {
    try {
        const func = require(`../${folder}/${file}`);
        
        if (typeof func === 'function') {
            if (!skipCheck.includes(file.split('.')[0])) func(client);
            console.log(chalk.greenBright(`[Function Loader] Loaded ${file} in ${folder}.`));
        } else {
            if (skipCheck.includes(file.split('.')[0])) return;
            console.error(chalk.redBright(`Error: ${file} in ${folder} is not exporting a function.`));
        }
    } catch (e) {
        console.error(chalk.redBright(`Error requiring ${file} in ${folder}: ${e}`));
    }
};

module.exports = loadFunctions;