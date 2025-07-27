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
            embed: {
                query: { title: 'Embed Title', description: 'Embed Description', view: 'View' }
            },
            menu: { placeholder: 'Select an option' }
        };
    });

    it('should throw error for unsupported type', () => {
        const titles = new Map();
        expect(() => buildTitleListEmbed(embed, translations, titles, 'unsupported')).toThrow('Unsupported type');
    });

    describe('MangaDex', () => {
        it('should build a MangaDex embed with correct fields and menu', () => {
            const titles = new Map([
                ['Official "Test" Manga', 'f9c33607-9180-4ba6-b85c-e4b5faee7192'],
                ['RE: united', 'fb6d9239-e641-4654-9c57-61a1f696aa33'],
            ]);
            const row = buildTitleListEmbed(embed, translations, titles, 'mangadex');

            // Embed fields
            expect(embed.setTitle).toHaveBeenCalledWith('Embed Title');
            expect(embed.setDescription).toHaveBeenCalledWith('Embed Description');
            expect(embed.setColor).toHaveBeenCalledWith(Colors.Blurple);
            const expectedFields = [
                { name: 'Official "Test" Manga', value: `[View](${urlFormats.mangadex.primary.replace('{id}', 'f9c33607-9180-4ba6-b85c-e4b5faee7192').replace('{title}', '')})` },
                { name: 'RE: united', value: `[View](${urlFormats.mangadex.primary.replace('{id}', 'fb6d9239-e641-4654-9c57-61a1f696aa33').replace('{title}', '')})` }
            ];
            expect(embed.addFields).toHaveBeenCalledWith(expectedFields);

            // Returned ActionRowBuilder with menu
            expect(row).toBeInstanceOf(ActionRowBuilder);
            const [menu] = row.components;
            expect(menu).toBeInstanceOf(StringSelectMenuBuilder);
            // Menu properties
            expect(menu.data.custom_id).toBe('mangadex_select');
            expect(menu.data.placeholder).toBe('Select an option');
            expect(menu.data.min_values).toBe(1);
            expect(menu.data.max_values).toBe(1);
            // Options
            expect(menu.options).toHaveLength(2);
            expect(menu.options.map(opt => opt.data)).toEqual(
                [
                    { emoji: undefined, label: 'Official "Test" Manga', value: 'f9c33607-9180-4ba6-b85c-e4b5faee7192' },
                    { emoji: undefined, label: 'RE: united', value: 'fb6d9239-e641-4654-9c57-61a1f696aa33' }
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
            const row = buildTitleListEmbed(embed, translations, titles, 'namicomi');

            // Embed fields
            expect(embed.setTitle).toHaveBeenCalledWith('Embed Title');
            expect(embed.setDescription).toHaveBeenCalledWith('Embed Description');
            expect(embed.setColor).toHaveBeenCalledWith(Colors.Blurple);
            const expectedFields = [
                { name: 'RE: united', value: `[View](${urlFormats.namicomi.shortened.replace('{id}', 'fQNjpmyE').replace('{title}', '')})` },
                { name: 'Magical Girl Chronicles', value: `[View](${urlFormats.namicomi.shortened.replace('{id}', 'XNcxN7JA').replace('{title}', '')})` }
            ];
            expect(embed.addFields).toHaveBeenCalledWith(expectedFields);

            // Returned ActionRowBuilder with menu
            expect(row).toBeInstanceOf(ActionRowBuilder);
            const [menu] = row.components;
            expect(menu).toBeInstanceOf(StringSelectMenuBuilder);
            // Menu properties
            expect(menu.data.custom_id).toBe('namicomi_select');
            expect(menu.data.placeholder).toBe('Select an option');
            expect(menu.data.min_values).toBe(1);
            expect(menu.data.max_values).toBe(1);
            // Options
            expect(menu.options).toHaveLength(2);
            expect(menu.options.map(opt => opt.data)).toEqual(
                [
                    { emoji: undefined, label: 'RE: united', value: 'fQNjpmyE' },
                    { emoji: undefined, label: 'Magical Girl Chronicles', value: 'XNcxN7JA' }
                ]
            );
        });
    });

    describe('empty titles', () => {
        it('should handle empty titles map for MangaDex', () => {
            const titles = new Map();
            const row = buildTitleListEmbed(embed, translations, titles, 'mangadex');
            // No fields
            expect(embed.addFields).toHaveBeenCalledWith([]);
            // No options
            const [menu] = row.components;
            expect(menu.options).toHaveLength(0);
        });

        it('should handle empty titles map for NamiComi', () => {
            const titles = new Map();
            const row = buildTitleListEmbed(embed, translations, titles, 'namicomi');
            // No fields
            expect(embed.addFields).toHaveBeenCalledWith([]);
            // No options
            const [menu] = row.components;
            expect(menu.options).toHaveLength(0);
        });
    });
});