const buildTitleListEmbed = require('../../../src/functions/titles/titleListEmbed');
const { urlFormats } = require('../../../src/functions/parsers/urlParser');
const { ActionRowBuilder, StringSelectMenuBuilder, Colors } = require('discord.js');

describe('buildTitleListEmbed', () => {
    let embed;
    let translations;
    beforeEach(() => {
        embed = {
            setTitle: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            setColor: jest.fn().mockReturnThis(),
            addFields: jest.fn().mockReturnThis(),
        };
        translations = {
            response: {
                embed: {
                    query: { title: 'Embed Title', description: 'Embed Description', view: 'View' }
                },
                menu: {
                    title: 'Search Results',
                    description: 'Here are the search results for `{query}` on {source}.',
                    placeholder: 'Select a title to view more information...',
                    view: 'View Title on {source}'
                }
            },
            sources: {
                mangabaka: 'MangaBaka',
                mangadex: 'MangaDex',
                namicomi: 'NamiComi'
            }
        };
    });

    it('should return null for unsupported type', () => {
        const titles = new Map();
        const result = buildTitleListEmbed(embed, translations, titles, 'unsupported', '');
        expect(result).toBeNull();
    });

    describe('MangaBaka', () => {
        it('should build a MangaBaka embed with correct fieds and menu', () => {
            const titles = new Map([
                ['RE: united', 5258],
                ['Example Title', '0']
            ]);
            const row = buildTitleListEmbed(embed, translations, titles, 'mangabaka', 'test');

            // Embed fields
            expect(embed.setTitle).toHaveBeenCalledWith('Search Results');
            expect(embed.setDescription).toHaveBeenCalledWith('Here are the search results for `test` on MangaBaka.');
            expect(embed.setColor).toHaveBeenCalledWith(Colors.Blurple);
            const expectedFields = [
                { name: 'RE: united', value: `[View Title on MangaBaka](${urlFormats.mangabaka.primary.replace('{id}', '5258').replace('{title}', '')})` },
                { name: 'Example Title', value: `[View Title on MangaBaka](${urlFormats.mangabaka.primary.replace('{id}', '0').replace('{title}', '')})` }
            ];
            expect(embed.addFields).toHaveBeenCalledWith(expectedFields);

            // Returned ActionRowBuilder with menu
            expect(row).toBeInstanceOf(ActionRowBuilder);
            const [menu] = row.components;
            expect(menu).toBeInstanceOf(StringSelectMenuBuilder);
            // Menu properties
            expect(menu.data.custom_id).toBe('search_select');
            expect(menu.data.placeholder).toBe('Select a title to view more information...');
            expect(menu.data.min_values).toBe(1);
            expect(menu.data.max_values).toBe(1);
            // Options
            expect(menu.options).toHaveLength(2);
            expect(menu.options.map(opt => opt.data)).toEqual(
                [
                    { emoji: undefined, label: 'RE: united', value: 'mangabaka:5258' },
                    { emoji: undefined, label: 'Example Title', value: 'mangabaka:0' }
                ]
            );
        });
    });
    describe('MangaDex', () => {
        it('should build a MangaDex embed with correct fields and menu', () => {
            const titles = new Map([
                ['Official "Test" Manga', 'f9c33607-9180-4ba6-b85c-e4b5faee7192'],
                ['RE: united', 'fb6d9239-e641-4654-9c57-61a1f696aa33'],
            ]);
            const row = buildTitleListEmbed(embed, translations, titles, 'mangadex', 'test');

            // Embed fields
            expect(embed.setTitle).toHaveBeenCalledWith('Search Results');
            expect(embed.setDescription).toHaveBeenCalledWith('Here are the search results for `test` on MangaDex.');
            expect(embed.setColor).toHaveBeenCalledWith(Colors.Blurple);
            const expectedFields = [
                { name: 'Official "Test" Manga', value: `[View Title on MangaDex](${urlFormats.mangadex.primary.replace('{id}', 'f9c33607-9180-4ba6-b85c-e4b5faee7192').replace('{title}', '')})` },
                { name: 'RE: united', value: `[View Title on MangaDex](${urlFormats.mangadex.primary.replace('{id}', 'fb6d9239-e641-4654-9c57-61a1f696aa33').replace('{title}', '')})` }
            ];
            expect(embed.addFields).toHaveBeenCalledWith(expectedFields);

            // Returned ActionRowBuilder with menu
            expect(row).toBeInstanceOf(ActionRowBuilder);
            const [menu] = row.components;
            expect(menu).toBeInstanceOf(StringSelectMenuBuilder);
            // Menu properties
            expect(menu.data.custom_id).toBe('search_select');
            expect(menu.data.placeholder).toBe('Select a title to view more information...');
            expect(menu.data.min_values).toBe(1);
            expect(menu.data.max_values).toBe(1);
            // Options
            expect(menu.options).toHaveLength(2);
            expect(menu.options.map(opt => opt.data)).toEqual(
                [
                    { emoji: undefined, label: 'Official "Test" Manga', value: 'mangadex:f9c33607-9180-4ba6-b85c-e4b5faee7192' },
                    { emoji: undefined, label: 'RE: united', value: 'mangadex:fb6d9239-e641-4654-9c57-61a1f696aa33' }
                ]
            );
        });
    });

    describe('NamiComi', () => {
        it('should build a NamiComi embed with correct fields and menu', () => {
            const titles = new Map([
                ['RE: united', 'fQNjpmyE'],
                ['Magical Girl Chronicles', 'XNcxN7JA'],
            ]);
            const row = buildTitleListEmbed(embed, translations, titles, 'namicomi', 'test');

            // Embed fields
            expect(embed.setTitle).toHaveBeenCalledWith('Search Results');
            expect(embed.setDescription).toHaveBeenCalledWith('Here are the search results for `test` on NamiComi.');
            expect(embed.setColor).toHaveBeenCalledWith(Colors.Blurple);
            const expectedFields = [
                { name: 'RE: united', value: `[View Title on NamiComi](${urlFormats.namicomi.shortened.replace('{id}', 'fQNjpmyE').replace('{title}', '')})` },
                { name: 'Magical Girl Chronicles', value: `[View Title on NamiComi](${urlFormats.namicomi.shortened.replace('{id}', 'XNcxN7JA').replace('{title}', '')})` }
            ];
            expect(embed.addFields).toHaveBeenCalledWith(expectedFields);

            // Returned ActionRowBuilder with menu
            expect(row).toBeInstanceOf(ActionRowBuilder);
            const [menu] = row.components;
            expect(menu).toBeInstanceOf(StringSelectMenuBuilder);
            // Menu properties
            expect(menu.data.custom_id).toBe('search_select');
            expect(menu.data.placeholder).toBe('Select a title to view more information...');
            expect(menu.data.min_values).toBe(1);
            expect(menu.data.max_values).toBe(1);
            // Options
            expect(menu.options).toHaveLength(2);
            expect(menu.options.map(opt => opt.data)).toEqual(
                [
                    { emoji: undefined, label: 'RE: united', value: 'namicomi:fQNjpmyE' },
                    { emoji: undefined, label: 'Magical Girl Chronicles', value: 'namicomi:XNcxN7JA' }
                ]
            );
        });
    });

    describe('empty titles', () => {
        it('should handle empty titles map for MangaDex', () => {
            const titles = new Map();
            const row = buildTitleListEmbed(embed, translations, titles, 'mangadex', 'test');
            // No fields
            expect(embed.addFields).toHaveBeenCalledWith([]);
            // No options
            const [menu] = row.components;
            expect(menu.options).toHaveLength(0);
        });

        it('should handle empty titles map for NamiComi', () => {
            const titles = new Map();
            const row = buildTitleListEmbed(embed, translations, titles, 'namicomi', 'test');
            // No fields
            expect(embed.addFields).toHaveBeenCalledWith([]);
            // No options
            const [menu] = row.components;
            expect(menu.options).toHaveLength(0);
        });
    });
});