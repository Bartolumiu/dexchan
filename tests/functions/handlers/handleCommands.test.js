jest.mock('@discordjs/rest', () => ({
    REST: jest.fn().mockImplementation(() => {
        const instance = {
            put: jest.fn(),
            setToken: function(token) { return instance; }
        };
        return instance;
    })
}));

jest.mock('discord-api-types/v10', () => ({
    Routes: {
        applicationCommands: jest.fn(),
        applicationGuildCommands: jest.fn()
    }
}));

describe('handleCommands', () => {
    let client;

    beforeEach(() => {
        jest.resetModules();
        client = { commands: new Map() };
        require('fs').readdirSync = jest.fn((path) => {
            if (path === './src/commands') return ['configuration', 'utils'];
            if (path === './src/commands/configuration') return ['settings.js'];
            if (path === './src/commands/utils') return ['commands.js', 'help.js', 'ping.js'];
            return [];
        });
        console.log = jest.fn();
    });

    it('should load commands from folders correctly', async () => {
        jest.doMock('../../../src/commands/configuration/settings.js', () => ({
            data: { name: 'settings', toJSON: () => ({ name: 'settings' }) },
            global: true
        }), { virtual: true });

        jest.doMock('../../../src/commands/utils/commands.js', () => ({
            data: { name: 'commands', toJSON: () => ({ name: 'commands' }) },
            global: true
        }), { virtual: true });

        jest.doMock('../../../src/commands/utils/help.js', () => ({
            data: { name: 'help', toJSON: () => ({ name: 'help' }) },
            global: true
        }), { virtual: true });

        jest.doMock('../../../src/commands/utils/ping.js', () => ({
            data: { name: 'ping', toJSON: () => ({ name: 'ping' }) },
            global: true
        }), { virtual: true });

        require('../../../src/functions/handlers/handleCommands')(client);
        await client.handleCommands();

        expect(client.commands.has('settings')).toBe(true);
        expect(client.commands.has('commands')).toBe(true);
        expect(client.commands.has('help')).toBe(true);
        expect(client.commands.has('ping')).toBe(true);
    });

    it('should categorize commands correctly', async () => {
        const globalCommandList = [
            { name: 'settings' },
            { name: 'help' }
        ];
        const guildCommandMap = new Map(function* () {
            yield ['000000000000000000', [{ name: 'commands' }]];
        }());

        jest.doMock('../../../src/commands/configuration/settings.js', () => ({
            data: { name: 'settings', toJSON: () => ({ name: 'settings' }) },
            global: true
        }), { virtual: true });
        
        jest.doMock('../../../src/commands/utils/commands.js', () => ({
            data: { name: 'commands', toJSON: () => ({ name: 'commands' }) },
            global: false,
            guildID: '000000000000000000'
        }), { virtual: true });

        require('../../../src/functions/handlers/handleCommands')(client);
        await client.handleCommands();

        expect(client.commands.get('ping').global).toBe(true);
        expect(client.commands.get('commands').global).toBe(false);
        expect(client.commands.get('commands').guildID).toBe('000000000000000000');
        expect(globalCommandList).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'settings' })]));
        expect(guildCommandMap.has('000000000000000000')).toBe(true);
    });

    it('should handle errors gracefully', async () => {
        jest.resetModules();

        jest.doMock('@discordjs/rest', () => ({
            REST: jest.fn().mockImplementation(() => ({
                put: jest.fn().mockRejectedValue(new Error('Failed to load settings')),
                setToken: function(token) {
                    return this;
                }
            }))
        }), { virtual: true });

        // No data property in settings.js
        jest.doMock('../../../src/commands/configuration/settings.js', () => ({
            global: true
        }), { virtual: true });
        console.warn = jest.fn();
        console.error = jest.fn();

        require('../../../src/functions/handlers/handleCommands')(client);
        await client.handleCommands();

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to reload application (/) commands'),
            expect.objectContaining({ message: 'Failed to load settings' })
        );
        expect(client.commands.size).toBe(3);
    });

    it('should trigger an error when a command file fails to load', async () => {
        console.error = jest.fn();

        jest.doMock('../../../src/commands/configuration/settings.js', () => {
            throw new Error('Failed to load settings');
        }, { virtual: true });

        require('../../../src/functions/handlers/handleCommands')(client);
        await client.handleCommands();

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error requiring settings.js in configuration: Failed to load settings')
        );
    });

    it('should trigger an error if a command is neither global nor guild-specific', async () => {
        console.error = jest.fn();

        jest.doMock('../../../src/commands/test/invalid.js', () => ({
            data: { name: 'invalid', toJSON: () => ({ name: 'invalid' }) },
            global: false
        }), { virtual: true });

        require('fs').readdirSync = jest.fn((path) => {
            if (path === './src/commands') return ['test'];
            if (path === './src/commands/test') return ['invalid.js'];
            return [];
        });

        require('../../../src/functions/handlers/handleCommands')(client);
        await client.handleCommands();

        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('Command /invalid does not have a guildID set and is not marked as global. Skipping.')
        );
    });

    it('should resolve command.data when it is a function', async () => {
        jest.doMock('../../../src/commands/test/function.js', () => ({
            data: () => Promise.resolve({ name: 'function', toJSON: () => ({ name: 'function' }) }),
            global: true
        }), { virtual: true });

        require('fs').readdirSync = jest.fn((path) => {
            if (path === './src/commands') return ['test'];
            if (path === './src/commands/test') return ['function.js'];
            return [];
        });

        require('../../../src/functions/handlers/handleCommands')(client);
        await client.handleCommands();

        expect(client.commands.has('function')).toBe(true);
    });

    it('should create a guildCommandMap entry if guildID is not present', async () => {
        jest.doMock('../../../src/commands/test/guild.js', () => ({
            data: { name: 'guild', toJSON: () => ({ name: 'guild' }) },
            global: false,
            guildID: '000000000000000000'
        }), { virtual: true });

        jest.doMock('../../../src/commands/test/guild2.js', () => ({
            data: { name: 'guild2', toJSON: () => ({ name: 'guild2' }) },
            global: false,
            guildID: '000000000000000000'
        }), { virtual: true });

        require('fs').readdirSync = jest.fn((path) => {
            if (path === './src/commands') return ['test'];
            if (path === './src/commands/test') return ['guild.js', 'guild2.js'];
            return [];
        });

        require('../../../src/functions/handlers/handleCommands')(client);
        await client.handleCommands();

        const cmd = client.commands.get('guild');
        expect(cmd).toBeDefined();
        expect(cmd.global).toBe(false);
        expect(cmd.guildID).toBe('000000000000000000');

        const cmd2 = client.commands.get('guild2');
        expect(cmd2).toBeDefined();
        expect(cmd2.global).toBe(false);
        expect(cmd2.guildID).toBe('000000000000000000');
    });
});