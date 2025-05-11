const commandsModule = require('../../../src/commands/utils/commands');
const { hasRolePermission } = require('../../../src/commands/utils/commands');
const { hasUserPermission } = require('../../../src/commands/utils/commands');
const { EmbedBuilder } = require('discord.js');
const { getLocale } = require('../../../src/functions/handlers/handleLocales');

// Mock dependencies
jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn().mockImplementation(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setDescriptionLocalizations: jest.fn().mockReturnThis(),
    })),
    EmbedBuilder: jest.fn().mockImplementation(() => ({
        setTitle: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addFields: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setFooter: jest.fn().mockReturnThis(),
        setTimestamp: jest.fn().mockReturnThis(),
    })),
    Colors: { Blurple: 'BLURPLE' }
}));
jest.mock('../../../src/functions/handlers/handleLocales', () => ({
    translateAttribute: jest.fn().mockResolvedValue({ en: 'desc' })
}));

describe('commands module', () => {
    describe('data', () => {
        it('should return a SlashCommandBuilder with correct localizations', async () => {
            const data = await commandsModule.data();
            expect(data.setName).toHaveBeenCalledWith('commands');
            expect(data.setDescription).toHaveBeenCalledWith('Get the list of the commands you can use');
            expect(data.setDescriptionLocalizations).toHaveBeenCalledWith({ en: 'desc' });
        });
    });

    describe('hasRolePermission', () => {
        it('returns true if user has required role', () => {
            const perms = [
                { type: 1, permission: true, id: 'role1' },
                { type: 2, permission: true, id: 'user1' }
            ];
            const interaction = {
                member: {
                    roles: {
                        cache: [{ id: 'role1' }, { id: 'role2' }]
                    }
                }
            };
            expect(hasRolePermission(perms, interaction)).toBe(true);
        });

        it('returns false if user does not have required role', () => {
            const perms = [{ type: 1, permission: true, id: 'role3' }];
            const interaction = {
                member: {
                    roles: {
                        cache: [{ id: 'role1' }, { id: 'role2' }]
                    }
                }
            };
            expect(hasRolePermission(perms, interaction)).toBe(false);
        });

        it('returns false if no role permissions', () => {
            const perms = [{ type: 2, permission: true, id: 'user1' }];
            const interaction = {
                member: {
                    roles: {
                        cache: [{ id: 'role1' }]
                    }
                }
            };
            expect(hasRolePermission(perms, interaction)).toBe(false);
        });
    });

    describe('hasUserPermission', () => {
        it('returns true if user has permission', () => {
            const perms = [
                { type: 2, permission: true, id: 'user1' },
                { type: 1, permission: true, id: 'role1' }
            ];
            const interaction = { user: { id: 'user1' } };
            expect(hasUserPermission(perms, interaction)).toBe(true);
        });

        it('returns false if user does not have permission', () => {
            const perms = [{ type: 2, permission: true, id: 'user2' }];
            const interaction = { user: { id: 'user1' } };
            expect(hasUserPermission(perms, interaction)).toBe(false);
        });

        it('returns false if no user permissions', () => {
            const perms = [{ type: 1, permission: true, id: 'role1' }];
            const interaction = { user: { id: 'user1' } };
            expect(hasUserPermission(perms, interaction)).toBe(false);
        });
    });

    describe('execute', () => {
        let interaction, client, embedInstance;
        beforeEach(() => {
            embedInstance = {
                setTitle: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
                addFields: jest.fn().mockReturnThis(),
                setColor: jest.fn().mockReturnThis(),
                setFooter: jest.fn().mockReturnThis(),
                setTimestamp: jest.fn().mockReturnThis(),
            };
            EmbedBuilder.mockImplementation(() => embedInstance);

            interaction = {
                user: { id: 'user1', username: 'TestUser' },
                locale: 'en',
                commandName: 'commands',
                member: {
                    permissions: { has: jest.fn().mockReturnValue(true) },
                    roles: { cache: [{ id: 'role1' }] }
                },
                guild: {
                    commands: {
                        fetch: jest.fn().mockResolvedValue(new Map([
                            ['2', { id: '2', name: 'guildcmd', defaultMemberPermissions: null }]
                        ])),
                        permissions: {
                            fetch: jest.fn().mockResolvedValue(new Map([
                                ['2', [{ type: 2, permission: true, id: 'user1' }]]
                            ]))
                        }
                    }
                },
                reply: jest.fn()
            };
            client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                translate: jest.fn().mockResolvedValue('translated'),
                application: {
                    commands: {
                        fetch: jest.fn().mockResolvedValue(new Map([
                            ['1', { id: '1', name: 'globalcmd', defaultMemberPermissions: null }]
                        ]))
                    }
                },
                user: {
                    displayAvatarURL: jest.fn().mockReturnValue('avatar_url')
                }
            };
        });

        it('should reply with an embed containing available commands', async () => {
            await commandsModule.execute(interaction, client);
            expect(interaction.reply).toHaveBeenCalledWith({
                embeds: [embedInstance]
            });
            expect(embedInstance.setTitle).toHaveBeenCalledWith('translated');
            expect(embedInstance.addFields).toHaveBeenCalled();
        });

        it('should filter commands based on permissions', async () => {
            // Simulate a command with defaultMemberPermissions that user does not have
            interaction.member.permissions.has.mockReturnValueOnce(false);
            await commandsModule.execute(interaction, client);
            expect(interaction.reply).toHaveBeenCalled();
        });

        it('should check defaultMemberPermissions and include command if user has permission', async () => {
            const adminPermission = 'ADMINISTRATOR';
            const commandWithPermission = { id: '3', name: 'admincmd', defaultMemberPermissions: adminPermission };
            client.application.commands.fetch.mockResolvedValue(new Map([
                ['3', commandWithPermission]
            ]));

            interaction.member.permissions.has.mockImplementation(permission => permission === adminPermission);
            interaction.guild.commands.fetch.mockResolvedValue(new Map());
            interaction.guild.commands.permissions.fetch.mockResolvedValue(new Map());

            await commandsModule.execute(interaction, client);
            expect(interaction.reply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)]
            });
            expect(interaction.member.permissions.has).toHaveBeenCalledWith(adminPermission);
            expect(embedInstance.addFields).toHaveBeenCalledWith([{
                name: '/admincmd',
                value: 'translated'
            }]);
        });

        it('should process commands if defaultMemberPermissions is null', async () => {
            const command = { id: '4', name: 'publiccmd', defaultMemberPermissions: null };
            client.application.commands.fetch.mockResolvedValue(new Map([
                ['4', command]
            ]));
            interaction.guild.commands.fetch.mockResolvedValue(new Map());
            interaction.guild.commands.permissions.fetch.mockResolvedValue(new Map());
            await commandsModule.execute(interaction, client);
            expect(interaction.reply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)]
            });
            expect(embedInstance.addFields).toHaveBeenCalledWith([{
                name: '/publiccmd',
                value: 'translated'
            }]);
        });

        it('should process commands if defaultMemberPermissions is undefined', async () => {
            const command = { id: '5', name: 'undefinedcmd' };
            client.application.commands.fetch.mockResolvedValue(new Map([
                ['5', command]
            ]));
            interaction.guild.commands.fetch.mockResolvedValue(new Map());
            interaction.guild.commands.permissions.fetch.mockResolvedValue(new Map());
            await commandsModule.execute(interaction, client);
            expect(interaction.reply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)]
            });
            expect(embedInstance.addFields).toHaveBeenCalledWith([{
                name: '/undefinedcmd',
                value: 'translated'
            }]);
        });

        it('should not include command if defaultMemberPermissions is set and user lacks permission', async () => {
            const adminPermission = 'ADMINISTRATOR';
            const commandWithPermission = { id: '9', name: 'adminonly', defaultMemberPermissions: adminPermission };
            client.application.commands.fetch.mockResolvedValue(new Map([
                ['9', commandWithPermission]
            ]));
            interaction.guild.commands.fetch.mockResolvedValue(new Map());
            interaction.guild.commands.permissions.fetch.mockResolvedValue(new Map());
            interaction.member.permissions.has.mockReturnValue(false); // User does NOT have permission

            await commandsModule.execute(interaction, client);

            // The command should NOT be included in the embed fields
            expect(embedInstance.addFields).not.toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: '/adminonly' })
                ])
            );
        });
    });
});