const { readdirSync } = require('fs');
const path = require('path');

module.exports = (client) => {
    client.handleComponents = async () => {
        const componentFolders = readdirSync('./src/components');
        const { buttons, selectMenus, modals } = client;

        const componentMap = {
            buttons,
            selectMenus,
            modals
        };

        for (const folder of componentFolders) {
            const components = componentMap[folder];
            if (!components) {
                console.error(`[Component Handler] Error: ${folder} is not a valid component folder.`);
                continue;
            }

            const componentFiles = readdirSync(`./src/components/${folder}`).filter(file => file.endsWith('.js'));
            await loadComponents(components, folder, componentFiles);
        }
    }
}

async function loadComponents(collection, folder, componentFiles) {
    const chalkInstance = await import('chalk');
    const chalk = chalkInstance.default;

    for (const file of componentFiles) {
        const filePath = path.join(__dirname, `../../components/${folder}/${file}`);

        try {
            const component = require(filePath);
            collection.set(component.data.customId, component);

            console.log(chalk.greenBright(`[Component Handler] Component ${component.data.customId} loaded.`));
        } catch (e) {
            console.error(chalk.redBright(`[Component Handler] Error loading ${file} in ${folder}: ${e.message}`));
        }
    }
}