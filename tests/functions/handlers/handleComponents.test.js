const fs = require('fs');
const getChalk = require('../../../src/functions/tools/getChalk');

jest.mock('fs');

jest.mock('chalk', () => ({
    default: {
        blueBright: (msg) => msg,
        greenBright: (msg) => msg,
        redBright: (msg) => msg,
    }
}), { virtual: true });

const fsMockData = {
    './src/components': ['buttons', 'selectMenus', 'modals'],
    './src/components/buttons': ['button.js'],
    './src/components/selectMenus': ['selectMenu.js'],
    './src/components/modals': ['modal.js'],
    './src/components/invalidFolder': ['invalidComponent.js'],
}

fs.readdirSync.mockImplementation((path) => {
    return fsMockData[path] || [];
});

jest.mock('../../../src/components/buttons/button.js', () => {
    return {
        data: { customId: 'button' },
        execute: jest.fn(),
    };
}, { virtual: true });
jest.mock('../../../src/components/selectMenus/selectMenu.js', () => {
    return {
        data: { customId: 'selectMenu' },
        execute: jest.fn(),
    };
}, { virtual: true });
jest.mock('../../../src/components/modals/modal.js', () => {
    return {
        data: { customId: 'modal' },
        execute: jest.fn(),
    };
}, { virtual: true });
jest.mock('../../../src/components/invalidFolder/invalidComponent.js', () => {
    return {
        data: { customId: 'invalidComponent' },
        execute: jest.fn(),
    };
}, { virtual: true });

describe('handleComponents', () => {
    let logSpy;
    let errorSpy;
    let client;

    beforeEach(() => {
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        client = {
            buttons: new Map(),
            selectMenus: new Map(),
            modals: new Map(),
        };
        require('../../../src/functions/handlers/handleComponents')(client);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should load components from folders correctly', async () => {
        const chalk = await getChalk();
        await client.handleComponents();

        expect(logSpy).toHaveBeenCalledWith(chalk.blueBright('[Component Handler] Loading components...'));
        expect(logSpy).toHaveBeenCalledWith(chalk.greenBright('[Component Handler] Component button loaded from button.js in buttons.'));
        expect(logSpy).toHaveBeenCalledWith(chalk.greenBright('[Component Handler] Component selectMenu loaded from selectMenu.js in selectMenus.'));
        expect(logSpy).toHaveBeenCalledWith(chalk.greenBright('[Component Handler] Component modal loaded from modal.js in modals.'));

        expect(client.buttons.has('button')).toBe(true);
        expect(client.selectMenus.has('selectMenu')).toBe(true);
        expect(client.modals.has('modal')).toBe(true);

        expect(client.buttons.get('button').data.customId).toBe('button');
        expect(client.selectMenus.get('selectMenu').data.customId).toBe('selectMenu');
        expect(client.modals.get('modal').data.customId).toBe('modal');
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should log an error for invalid folders', async () => {
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/components') return ['invalidFolder'];
            if (path === './src/components/invalidFolder') return ['invalidComponent.js'];
            return [];
        });

        await client.handleComponents();
        expect(errorSpy).toHaveBeenCalledWith('[Component Handler] Error: invalidFolder is not a valid component folder.');
        expect(client.buttons.has('invalidComponent')).toBe(false);
        expect(client.selectMenus.has('invalidComponent')).toBe(false);
        expect(client.modals.has('invalidComponent')).toBe(false);
    });

    it('should log an error if a component file fails to load', async () => {
        fs.readdirSync.mockImplementation((path) => {
            if (path === './src/components') return ['buttons'];
            if (path === './src/components/buttons') return ['invalidComponent.js'];
            return [];
        });

        jest.mock('../../../src/components/buttons/invalidComponent.js', () => {
            throw new Error('Failed to load component');
        }, { virtual: true });

        await client.handleComponents();
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[Component Handler] Error loading invalidComponent.js in buttons: Failed to load component'));
    });
});