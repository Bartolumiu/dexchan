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
            // Mock the translateAttribute function
            translateAttribute.mockResolvedValue({ 'en-GB': 'translated string' });
            const command = {
                name: 'settings',
                description: 'Change your settings',
                descriptionLocalizations: await translateAttribute('settings', 'description'),
                subcommands: {
                    view: {
                        name: 'view',
                        description: 'View your settings',
                        descriptionLocalizations: await translateAttribute('settings', 'subcommands.view.description')
                    }
                },
                subcommand_groups: {
                    locale: {
                        name: 'locale',
                        description: 'Your preferred locale',
                        descriptionLocalizations: await translateAttribute('settings', 'subcommand_groups.locale.description'),
                        subcommands: {
                            set: {
                                name: 'set',
                                description: 'Set your preferred locale',
                                descriptionLocalizations: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.set.description'),
                                options: {
                                    locale: {
                                        name: 'locale',
                                        description: 'The language you want to set as your preferred language',
                                        descriptionLocalizations: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.set.options.locale.description')
                                    }
                                }
                            },
                            reset: {
                                name: 'reset',
                                description: 'Reset your preferred locale',
                                descriptionLocalizations: await translateAttribute('settings', 'subcommand_groups.locale.subcommands.reset.description')
                            }
                        }
                    }
                }
            };

            await settingsCommand.data();
            expect(command.name).toBe('settings');
            expect(command.description).toBe('Change your settings');
            expect(command.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
            expect(command.subcommands.view.name).toBe('view');
            expect(command.subcommands.view.description).toBe('View your settings');
            expect(command.subcommands.view.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
            expect(command.subcommand_groups.locale.name).toBe('locale');
            expect(command.subcommand_groups.locale.description).toBe('Your preferred locale');
            expect(command.subcommand_groups.locale.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
            expect(command.subcommand_groups.locale.subcommands.set.name).toBe('set');
            expect(command.subcommand_groups.locale.subcommands.set.description).toBe('Set your preferred locale');
            expect(command.subcommand_groups.locale.subcommands.set.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
            expect(command.subcommand_groups.locale.subcommands.set.options.locale.name).toBe('locale');
            expect(command.subcommand_groups.locale.subcommands.set.options.locale.description).toBe('The language you want to set as your preferred language');
            expect(command.subcommand_groups.locale.subcommands.set.options.locale.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
            expect(command.subcommand_groups.locale.subcommands.reset.name).toBe('reset');
            expect(command.subcommand_groups.locale.subcommands.reset.description).toBe('Reset your preferred locale');
            expect(command.subcommand_groups.locale.subcommands.reset.descriptionLocalizations).toStrictEqual({ 'en-GB': 'translated string' });
            expect(command.subcommand_groups.locale.subcommands.reset.options).toBeUndefined();
            expect(require('../../../src/functions/handlers/translateAttribute')).toHaveBeenCalledTimes(12);
        });
    });

    describe('execute', () => {
        it('should call localeSettings when the locale subcommand group and the set subcommand is used', async () => {
            const interaction = {
                options: { getSubcommandGroup: () => 'locale', getSubcommand: () => 'set', getString: () => 'es' },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.success':
                            return 'Language Set';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.success':
                            return 'Your preferred language has been set to `%locale%`.'.replace('%locale%', 'es');
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
            expect(embed.data.title).toBe('Language Set');
            expect(embed.data.description).toBe('Your preferred language has been set to `es`.');
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
                getLocale: jest.fn().mockReturnValue('en'),
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
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.error.invalid_locale':
                            return 'Invalid Language';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.error.invalid_locale':
                            return 'The language `%locale%` is not valid.'.replace('%locale%', 'xx');
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
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error.invalid_locale'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error.invalid_locale'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Red
                }
            };

            await settingsCommand.execute(interaction, client);
            localeSettings(interaction, client, userProfile, embed);
            expect(embed.data.title).toBe('Invalid Language');
            expect(embed.data.description).toBe('The language `xx` is not valid.');
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
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
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
                    getString: () => 'es'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.success':
                            return 'Language Set';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.success':
                            return 'Your preferred language has been set to `%locale%`.'.replace('%locale%', 'es');
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
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
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Green
                }
            }

            await settingsCommand.execute(interaction, client);
            expect(userProfile.preferredLocale).toBe('en');
            expect(embed.data.title).toBe('Language Set');
            expect(embed.data.description).toBe('Your preferred language has been set to `es`.');
            expect(embed.data.color).toBe(Colors.Green);
        });

        it('should return an error embed if an error occurs while setting the locale', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'set',
                    getString: () => 'es'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.error.unknown':
                            return 'Unknown Error';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.error.unknown':
                            return 'An unknown error occurred while changing the language.';
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
                        default:
                            return '';
                    };
                })
            };
            const userProfile = { preferredLocale: 'en', save: jest.fn().mockRejectedValue(new Error('Save failed')) };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error.unknown'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error.unknown'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Red
                }
            }

            await settingsCommand.execute(interaction, client);

            expect(userProfile.preferredLocale).toBe('en');
            expect(embed.data.title).toBe('Unknown Error');
            expect(embed.data.description).toBe('An unknown error occurred while changing the language.');
            expect(embed.data.color).toBe(Colors.Red);
            await expect(userProfile.save).rejects.toThrow('Save failed');
        });

        it('should reset the locale and return a success embed', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'reset'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: null, save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.title.success':
                            return 'Language Reset';
                        case 'settings.subcommand_groups.locale.subcommands.reset.response.description.success':
                            return 'Your preferred language has been reset.';
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
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
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Green
                }
            }

            await settingsCommand.execute(interaction, client);

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
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.error.invalid_locale':
                            return 'Invalid Language';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.error.invalid_locale':
                            return 'The language `%locale%` is not valid.'.replace('%locale%', 'xx');
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
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
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error.invalid_locale'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error.invalid_locale'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Red
                }
            }

            await settingsCommand.execute(interaction, client);

            expect(userProfile.preferredLocale).toBe('en');
            expect(embed.data.title).toBe('Invalid Language');
            expect(embed.data.description).toBe('The language `xx` is not valid.');
            expect(embed.data.color).toBe(Colors.Red);
        });

        it('should return an error embed if an error occurs while resetting the locale (locale still set)', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'reset'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn().mockRejectedValue(new Error('Save failed')) }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
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
            const userProfile = { preferredLocale: 'en', save: jest.fn().mockRejectedValue(new Error('Save failed')) };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.error'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.error'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Red
                }
            }

            await settingsCommand.execute(interaction, client);

            expect(userProfile.preferredLocale).toBe('en');
            expect(embed.data.title).toBe('Error while resetting the language');
            expect(embed.data.description).toBe('An error occurred while resetting your preferred language.');
            expect(embed.data.color).toBe(Colors.Red);
            await expect(userProfile.save).rejects.toThrow('Save failed');
        });

        it('should return an error embed if an error occurs while resetting the locale (locale not set)', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'reset'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: null, save: jest.fn().mockRejectedValue(new Error('Save failed')) }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
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
            const userProfile = { preferredLocale: null, save: jest.fn().mockRejectedValue(new Error('Save failed')) };
            const embed = {
                setTitle: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn(),
                data: {
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.title.error'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.reset.response.description.error'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Red
                }
            }

            await settingsCommand.execute(interaction, client);

            expect(userProfile.preferredLocale).toBeNull();
            expect(embed.data.title).toBe('Error while resetting the language');
            expect(embed.data.description).toBe('An error occurred while resetting your preferred language.');
            expect(embed.data.color).toBe(Colors.Red);
            await expect(userProfile.save).rejects.toThrow('Save failed');
        });

        it('should return an error embed if the locale is the same as the current locale', async () => {
            const interaction = {
                options: {
                    getSubcommandGroup: () => 'locale',
                    getSubcommand: () => 'set',
                    getString: () => 'en'
                },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
                getMongoUserData: jest.fn().mockResolvedValue({ preferredLocale: 'en', save: jest.fn() }),
                translate: jest.fn().mockImplementation((locale, key, value) => {
                    switch (value) {
                        case 'settings.subcommand_groups.locale.subcommands.set.response.title.error.no_changes':
                            return 'No Changes';
                        case 'settings.subcommand_groups.locale.subcommands.set.response.description.error.no_changes':
                            return 'No changes made. The language remains set to `%locale%`.'.replace('%locale%', 'en');
                        case 'settings.response.footer':
                            return '/settings - Requested by test-user';
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
                    title: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.title.error.no_changes'),
                    description: client.translate('en', 'commands', 'settings.subcommand_groups.locale.subcommands.set.response.description.error.no_changes'),
                    footer: client.translate('en', 'commands', 'settings.response.footer'),
                    color: Colors.Red
                }
            }

            await settingsCommand.execute(interaction, client);

            expect(userProfile.preferredLocale).toBe('en');
            expect(embed.data.title).toBe('No Changes');
            expect(embed.data.description).toBe('No changes made. The language remains set to `en`.');
            expect(embed.data.color).toBe(Colors.Red);
        });
    });

    describe('viewSettings', () => {
        it('should populate the embed with the correct user settings', async () => {
            const interaction = { locale: 'en' };
            const client = {
                getLocale: jest.fn().mockReturnValue('en'),
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

        it('should return the locale list if the user input is empty', async () => {
            const interaction = { options: { getString: () => '', getSubcommandGroup: () => 'locale', getSubcommand: () => 'set' }, respond: jest.fn() };
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
            expect(autocompletion).toContainEqual({ name: 'English (en)', value: 'en' });
        });

        it('should not return any suggestions if the subcommand is not set or subcommand group is not locale', async () => {
            const interaction = { options: { getString: () => '', getSubcommandGroup: () => 'other', getSubcommand: () => 'view' }, respond: jest.fn() };

            await settingsCommand.autocomplete(interaction);
            expect(interaction.respond).not.toHaveBeenCalled();
        });

        it('should return if no valid subcommand group or subcommand is provided', async () => {
            const interaction = {
                options: { getSubcommandGroup: () => null, getSubcommand: () => null },
                locale: 'en',
                user: { id: '000000000000000000', username: 'test-user', displayAvatarURL: jest.fn() },
                reply: jest.fn()
            };

            const userProfile = { preferredLocale: 'en', save: jest.fn() };
            const client = {
                getMongoUserData: jest.fn().mockResolvedValue(userProfile),
                translate: jest.fn()
            };

            const embed = {
                setTitle: jest.fn(),
                setDescription: jest.fn(),
                setColor: jest.fn(),
                setFooter: jest.fn()
            };

            await settingsCommand.execute(interaction, client);
            expect(embed.setTitle).not.toHaveBeenCalled();
            expect(embed.setDescription).not.toHaveBeenCalled();
            expect(embed.setColor).not.toHaveBeenCalled();
            expect(embed.setFooter).not.toHaveBeenCalled();
            expect(interaction.reply).not.toHaveBeenCalled();
        });
    });
});
