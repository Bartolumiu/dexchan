const { readdirSync } = require('fs');

module.exports = (client) => {
    client.handleComponents = async () => {
        const componentFolders = readdirSync('./src/components');
        for (const folder of componentFolders) {
            const componentFiles = readdirSync(`./src/components/${folder}`).filter(file => file.endsWith('.js'));

            const { buttons, selectMenus, modals } = client;

            switch (folder) {
                case 'buttons':
                    loadButtons(buttons, componentFiles);
                    break;
                case 'selectMenus':
                    loadSelectMenus(selectMenus, componentFiles);
                    break;
                case 'modals':
                    loadModals(modals, componentFiles);
                    break;
                default:
                    console.error(`Error: ${folder} is not a valid component folder.`);
                    break;
            }
        }
    }
}

function loadButtons(buttons, componentFiles) {
    for (const file of componentFiles) {
        try {
            const button = require(`../../components/buttons/${file}`);
            buttons.set(button.data.customId, button);
        } catch (e) {
            console.error(`Error requiring ${file} in buttons: ${e}`);
        }
    }
}

function loadSelectMenus(selectMenus, componentFiles) {
    for (const file of componentFiles) {
        try {
            const selectMenu = require(`../../components/selectMenus/${file}`);
            selectMenus.set(selectMenu.data.customId, selectMenu);
        } catch (e) {
            console.error(`Error requiring ${file} in selectMenus: ${e}`);
        }
    }
}

function loadModals(modals, componentFiles) {
    for (const file of componentFiles) {
        try {
            const modal = require(`../../components/modals/${file}`);
            modals.set(modal.data.customId, modal);
        } catch (e) {
            console.error(`Error requiring ${file} in modals: ${e}`);
        }
    }
}