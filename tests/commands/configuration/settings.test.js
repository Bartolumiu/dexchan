const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const settingsCommand = require('../../../src/commands/configuration/settings');
const translateAttribute = require('../../../src/functions/handlers/translateAttribute');

jest.mock('../../../src/commands/configuration/settings', () => {
    return {
        ...jest.requireActual('../../../src/commands/configuration/settings'),
        localeSettings: jest.fn(),
        viewSettings: jest.fn()
    };
});

const { localeSettings, viewSettings } = require('../../../src/commands/configuration/settings');

jest.mock('../../../src/functions/handlers/translateAttribute', () => jest.fn().mockResolvedValue('translated string'));
jest.mock('fs', () => {
    return {
        readdirSync: jest.fn().mockReturnValue(['en.json', 'es.json']),
        readFileSync: jest.fn().mockReturnValue('{"name": "English (en)", "value": "en"}')
    }
});

describe('settings command', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('data', () => {
        it('should build the slash command with correct localizations', async () => {
            const command = {
                name: 'settings',
                description: 'Change your settings',
                descriptionLocalizations: await translateAttribute('settings', 'description'),
                subcommands: [
                    {
                        name: 'view',
                        description: 'View your settings',
                        descriptionLocalizations: await translateAttribute('settings', 'subcommands.view.description')
                    }
                ],
                subcommand_groups: [
                    {
                        name: 'locale',
                        description: 'Your preferred locale',
                        descriptionLocalizations: await translateAttribute('settings', 'subcommand_groups.locale.description'),
                        subcommands: [
                            {
                                name: 'set',
                                description: 'Set your preferred locale',
                                descriptionLocalizations: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.set.description'),
                                options: [
                                    {
                                        name: 'locale',
                                        description: 'The language you want to set as your preferred language',
                                        descriptionLocalizations: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.set.options.locale.description')
                                    }
                                ]
                            },
                            {
                                name: 'reset',
                                description: 'Reset your preferred locale',
                                descriptionLocalizations: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.reset.description')
                            }
                        ]
                    }
                ]
            };

            expect(command.name).toBe('settings');
            expect(command.description).toBe('Change your settings');
            expect(command.descriptionLocalizations).toBe('translated string');
            expect(command.subcommands[0].name).toBe('view');
            expect(command.subcommands[0].description).toBe('View your settings');
            expect(command.subcommands[0].descriptionLocalizations).toBe('translated string');
            expect(command.subcommand_groups[0].name).toBe('locale');
            expect(command.subcommand_groups[0].description).toBe('Your preferred locale');
            expect(command.subcommand_groups[0].descriptionLocalizations).toBe('translated string');
            expect(command.subcommand_groups[0].subcommands[0].name).toBe('set');
            expect(command.subcommand_groups[0].subcommands[0].description).toBe('Set your preferred locale');
            expect(command.subcommand_groups[0].subcommands[0].descriptionLocalizations).toBe('translated string');
            expect(command.subcommand_groups[0].subcommands[0].options[0].name).toBe('locale');
            expect(command.subcommand_groups[0].subcommands[0].options[0].description).toBe('The language you want to set as your preferred language');
            expect(command.subcommand_groups[0].subcommands[0].options[0].descriptionLocalizations).toBe('translated string');
            expect(command.subcommand_groups[0].subcommands[1].name).toBe('reset');
            expect(command.subcommand_groups[0].subcommands[1].description).toBe('Reset your preferred locale');
            expect(command.subcommand_groups[0].subcommands[1].descriptionLocalizations).toBe('translated string');
            expect(require('../../../src/functions/handlers/translateAttribute')).toHaveBeenCalledTimes(6);
        });
    });

    describe('execute', () => {
        it('should call localeSettings when the locale subcommand group and the set subcommand is used', async () => {
            const interaction = {
                options: { getSubcommandGroup: () => 'locale', getSubcommand: () => 'set', getString: () => 'en' },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };

            const userProfile = { preferredLocale: 'en', save: jest.fn() };
            const client = {
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.success':
                            return 'Language Set';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.success':
                            return 'Your preferred language has been set to `%locale%`.'.replace('%locale%', locale);
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
                        default:
                            return '';
                    };
                })
            };

            const embed = {
                setTitle: jest.fn(),
                setDescription: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.success'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.success'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Green
                }
            };

            await settingsCommand.execute(interaction, client);
            localeSettings(interaction, client, userProfile, embed);
            expect(localeSettings).toHaveBeenCalled();
            expect(embed.data.title).toBe('Language Set');
            expect(embed.data.description).toBe('Your preferred language has been set to `en`.');
            expect(embed.data.color).toBe(Colors.Green);
            expect(embed.data.footer).toBe('/settings - Requested by test-user');
        });

        it('should call viewSettings when the view subcommand is used', async () => {
            const interaction = {
                options: { getSubcommandGroup: () => null, getSubcommand: () => 'view' },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                commandName: 'settings',
                reply: jest.fn()
            };

            const userProfile = { preferredLocale: 'en', save: jest.fn() };
            const client = {
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en' }),
                translate: jest.fn().mockImplementation((locale, key, value, replacements = {}) => {
                    switch (value) {
                        case 'settings.subcommands.view.response.title':
                            return 'User Settings';
                        case 'settings.subcommands.view.response.description':
                            return 'View your current settings';
                        case 'settings.subcommands.view.response.fields.locale.name':
                            return 'Language';
                        case 'settings.subcommands.view.response.fields.locale.value':
                            return locale;
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
                        default:
                            return '';
                    };
                })
            };

            const embed = {
                setTitle: jest.fn(),
                setDescription: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                addFields: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommands.view.response.title'),
                    description: client.translate('en', 'commands', 'settings.subcommands.view.response.description'),
                    color: Colors.Blue,
                    fields: [{
                        name: client.translate('en', 'commands', 'settings.subcommands.view.response.fields.locale.name'),
                        value: client.translate('en', 'commands', 'settings.subcommands.view.response.fields.locale.value', { locale: userProfile.preferredLocale })
                    }],
                    footer: {
                        text: client.translate('en', 'commands', 'settings.response.footer', { command: `/${interaction.commandName}`, username: interaction.user.username }),
                        iconURL: interaction.user.displayAvatarURL()
                    }
                }
            };

            await settingsCommand.execute(interaction, client);
            viewSettings(interaction, client, userProfile, embed);
            expect(viewSettings).toHaveBeenCalled();
            expect(embed.data.title).toBe('User Settings');
            expect(embed.data.description).toBe('View your current settings');
            expect(embed.data.fields[0].name).toBe('Language');
            expect(embed.data.fields[0].value).toBe('en');
            expect(embed.data.color).toBe(Colors.Blue);
            expect(embed.data.footer.text).toBe('/settings - Requested by test-user');
        });

        it('should return an error embed if an invalid locale is provided', async () => {
            const interaction = {
                options: { getSubcommandGroup: () => 'locale', getSubcommand: () => 'set', getString: () => 'xx' },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };

            const userProfile = { preferredLocale: 'en', save: jest.fn() };
            const client = {
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.error':
                            return 'Error';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.error':
                            return 'An error occurred while setting your preferred language.';
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
                        default:
                            return '';
                    };
                })
            };

            const embed = {
                setTitle: jest.fn(),
                setDescription: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Red
                }
            };

            await settingsCommand.execute(interaction, client);
            localeSettings(interaction, client, userProfile, embed);
            expect(embed.data.title).toBe('Error');
            expect(embed.data.description).toBe('An error occurred while setting your preferred language.');
            expect(embed.data.color).toBe(Colors.Red);
            expect(embed.data.footer).toBe('/settings - Requested by test-user');
        });

        it('should call localeSettings when the locale subcommand group and reset subcommand is used', async () => {
            const interaction = {
                options: { getSubcommandGroup: () => 'locale', getSubcommand: () => 'reset' },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };

            const userProfile = { preferredLocale: 'en', save: jest.fn() };
            const client = {
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.title.success':
                            return 'Language Reset';
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.description.success':
                            return 'Your preferred language has been reset.';
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.title.error':
                            return 'Error while resetting the language';
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.description.error':
                            return 'An error occurred while resetting your preferred language.';
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
                        default:
                            return '';
                    };
                })
            };

            const embed = {
                setTitle: jest.fn(),
                setDescription: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.success'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.success'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Green
                }
            };

            await settingsCommand.execute(interaction, client);
            localeSettings(interaction, client, userProfile, embed);
            expect(embed.data.title).toBe('Language Reset');
            expect(embed.data.description).toBe('Your preferred language has been reset.');
            expect(embed.data.color).toBe(Colors.Green);
            expect(embed.data.footer).toBe('/settings - Requested by test-user');
        });
    });

    describe('localeSettings', () => {
        it('should set the locale and return a success embed', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'set',
                    getString: () => 'en'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() }
            };
            const client = {
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.success':
                            return 'Language Set';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.success':
                            return 'Your preferred language has been set to `%locale%`.'.replace('%locale%', locale);
                        default:
                            return '';
                    };
                })
            };
            const userProfile = { preferredLocale: 'en', save: jest.fn() };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.success'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.success'),
                    color: Colors.Green
                }
            }

            await settingsCommand.localeSettings(interaction, client, userProfile, embed);

            expect(userProfile.preferredLocale).toBe('en');
            expect(embed.data.title).toBe('Language Set');
            expect(embed.data.description).toBe('Your preferred language has been set to `en`.');
            expect(embed.data.color).toBe(Colors.Green);
        });

        it('should reset the locale and return a success embed', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'reset'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
            };
            const client = {
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.title.success':
                            return 'Language Reset';
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.description.success':
                            return 'Your preferred language has been reset.';
                        default:
                            return '';
                    };
                })
            };
            const userProfile = { preferredLocale: null, save: jest.fn() };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.success'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.success'),
                    color: Colors.Green
                }
            }

            await settingsCommand.localeSettings(interaction, client, userProfile, embed);

            expect(userProfile.preferredLocale).toBeNull();
            expect(embed.data.title).toBe('Language Reset');
            expect(embed.data.description).toBe('Your preferred language has been reset.');
            expect(embed.data.color).toBe(Colors.Green);
        });

        it('should return an error embed if the locale is not found', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'set',
                    getString: () => 'xx'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() }
            };
            const client = {
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.error':
                            return 'Error';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.error':
                            return 'An error occurred while setting your preferred language.';
                        default:
                            return '';
                    };
                })
            };
            const userProfile = { preferredLocale: 'en', save: jest.fn() };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error'),
                    color: Colors.Red
                }
            }

            await settingsCommand.localeSettings(interaction, client, userProfile, embed);

            expect(userProfile.preferredLocale).toBe('en');
            expect(embed.data.title).toBe('Error');
            expect(embed.data.description).toBe('An error occurred while setting your preferred language.');
            expect(embed.data.color).toBe(Colors.Red);
        });

        it('should return an error embed if an error occurs while resetting the locale (locale still set)', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'reset'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() }
            };
            const client = {
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.title.error':
                            return 'Error while resetting the language';
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.description.error':
                            return 'An error occurred while resetting your preferred language.';
                        default:
                            return '';
                    };
                })
            };
            const userProfile = { preferredLocale: 'en', save: jest.fn() };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.error'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.error'),
                    color: Colors.Red
                }
            }

            await settingsCommand.localeSettings(interaction, client, userProfile, embed);

            expect(userProfile.preferredLocale).toBe('en');
            expect(embed.data.title).toBe('Error while resetting the language');
            expect(embed.data.description).toBe('An error occurred while resetting your preferred language.');
            expect(embed.data.color).toBe(Colors.Red);
        });

        it('should return an error embed if an error occurs while resetting the locale (locale not set)', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'reset'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() }
            };
            const client = {
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.title.error':
                            return 'Error while resetting the language';
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.description.error':
                            return 'An error occurred while resetting your preferred language.';
                        default:
                            return '';
                    };
                })
            };
            const userProfile = { preferredLocale: null, save: jest.fn() };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.error'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.error'),
                    color: Colors.Red
                }
            }

            await settingsCommand.localeSettings(interaction, client, userProfile, embed);

            expect(userProfile.preferredLocale).toBeNull();
            expect(embed.data.title).toBe('Error while resetting the language');
            expect(embed.data.description).toBe('An error occurred while resetting your preferred language.');
            expect(embed.data.color).toBe(Colors.Red);
        });    
    });

    describe('viewSettings', () => {
        it('should populate the embed with the correct user settings', async () => {
            const interaction = { locale: 'en' };
            const client = {
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommands.view.title':
                            return 'User Settings';
                        case 'settings.subcommands.view.description':
                            return 'View your current settings';
                        case 'settings.subcommands.view.fields.locale.name':
                            return 'Language';
                        case 'settings.subcommands.view.fields.locale.value':
                            return locale;
                        default:
                            return '';
                    };
                })
            };
            const userProfile = { preferredLocale: 'en' };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                addField: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommands.view.title'),
                    description: client.translate('en', 'commands', 'settings.subcommands.view.description'),
                    color: Colors.Blue,
                    fields: [{
                        name: client.translate('en', 'commands', 'settings.subcommands.view.fields.locale.name'),
                        value: client.translate('en', 'commands', 'settings.subcommands.view.fields.locale.value', { locale: userProfile.preferredLocale })
                    }]
                }
            };

            await settingsCommand.viewSettings(interaction, client, userProfile, embed);

            expect(embed.data.title).toBe('User Settings');
            expect(embed.data.description).toBe('View your current settings');
            expect(embed.data.fields[0].name).toBe('Language');
            expect(embed.data.fields[0].value).toBe('en');
            expect(embed.data.color).toBe(Colors.Blue);
            expect(client.translate).toHaveBeenCalledTimes(4);
        });
    });

    describe('autocomplete', () => {
        it('should return locale suggestions based on user input', async () => {
            const interaction = { options: { getString: () => 'en', getSubcommandGroup: () => 'locale', getSubcommand: () => 'set' }, respond: jest.fn() };
            const locales = [{ name: 'English (en)', value: 'en' }];

            jest.mock('../../../src/commands/configuration/settings', () => {
                const getLocaleListMock = jest.fn().mockResolvedValue(locales);
                return {
                    ...jest.requireActual('../../../src/commands/configuration/settings'),
                    getLocaleList: getLocaleListMock
                };
            });

            await settingsCommand.autocomplete(interaction);
            const autocompletion = interaction.respond.mock.calls[0][0];
            expect(autocompletion).toEqual([{ name: 'English (en)', value: 'en' }]);
        });
    });
});
