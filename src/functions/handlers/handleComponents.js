const { readdirSync } = require('fs');
const path = require('path');

/**
 * Handles the loading of components (buttons, selectMenus, modals) for the client.
 * 
 * @param {Object} client - The client object that contains the collections for components.
 * @param {Map} client.buttons - Collection of button components.
 * @param {Map} client.selectMenus - Collection of select menu components.
 * @param {Map} client.modals - Collection of modal components.
 * 
 * @function handleComponents
 * @async
 */
module.exports = (client) => {
    client.handleComponents = async () => {
        const chalkInstance = await import('chalk');
        const chalk = chalkInstance.default;
        console.log(chalk.blueBright('[Component Handler] Loading components...'));

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
            await loadComponents(components, folder, componentFiles, chalk);
        }
    }
}

/**
 * Loads components from the specified folder and adds them to the provided collection.
 * 
 * @param {Map} collection - The collection to which the components will be added.
 * @param {string} folder - The folder from which to load the components.
 * @param {string[]} componentFiles - Array of component file names to be loaded.
 * 
 * @returns {Promise<void>}
 * 
 * @function loadComponents
 * @async
 */
async function loadComponents(collection, folder, componentFiles, chalk) {
    for (const file of componentFiles) {
        const filePath = path.join(__dirname, `../../components/${folder}/${file}`);

        try {
            const component = require(filePath);
            collection.set(component.data.customId, component);

            console.log(chalk.greenBright(`[Component Handler] Component ${component.data.customId} loaded from ${file} in ${folder}.`));
        } catch (e) {
            console.error(chalk.redBright(`[Component Handler] Error loading ${file} in ${folder}: ${e.message}`));
        }
    }
}