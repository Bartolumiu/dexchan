const { readdirSync } = require('fs');

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
                console.error(`Error: ${folder} is not a valid component folder.`);
                continue;
            }

            const componentFiles = readdirSync(`./src/components/${folder}`).filter(file => file.endsWith('.js'));
            loadComponents(components, folder, componentFiles);
        }
    }
}

function loadComponents(collection, folder, componentFiles) {
    for (const file of componentFiles) {
        const filePath = path.join(__dirname, `../../components/${folder}/${file}`);

        try {
            const component = require(filePath);
            collection.set(component.data.customId, component);
        } catch (e) {
            console.error(`Error requiring ${file} in ${folder}: ${e.message}`);
        }
    }
}