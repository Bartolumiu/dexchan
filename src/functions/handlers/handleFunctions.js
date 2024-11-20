const { readdirSync } = require('fs');

const loadFunctions = async (client) => {
    const skipCheck = ['checkUpdates', 'urlParser', 'handleFunctions'];

    const functionFolders = readdirSync('./src/functions');
    for (const folder of functionFolders) {
        const functions = readdirSync(`./src/functions/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of functions) {
            try {
                const func = require(`../${folder}/${file}`);
                
                if (typeof func === 'function') {
                    if (!skipCheck.includes(file.split('.')[0])) func(client);
                } else {
                    if (skipCheck.includes(file.split('.')[0])) continue;
                    console.error(`Error: ${file} in ${folder} is not exporting a function.`);
                }
            } catch (e) {
                console.error(`Error requiring ${file} in ${folder}: ${e}`);
            };
        };
    };
};

module.exports = loadFunctions;