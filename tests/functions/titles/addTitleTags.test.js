const { addTitleTags } = require('../../../src/functions/titles/titleTags');

describe('addTitleTags as namicomi', () => {
    let embed;
    let translations;
    beforeEach(() => {
        embed = { addFields: jest.fn() };
        translations = {
            embed: {
                fields: {
                    format: 'Format',
                    genres: 'Genres',
                    themes: 'Themes',
                    content_warning: 'Content Warning',
                    other_tags: 'Other'
                }
            }
        };
    });

    it('should add correct fields for namicomi with locale', () => {
        const sampleTitle = {
            relationships: [
                { type: 'tag', attributes: { group: 'format', name: { en: 'Webtoon', ja: 'ウェブトゥーン' } } },
                { type: 'primary_tag', attributes: { group: 'genre', name: { en: 'Romance', ja: 'ロマンス' } } },
                { type: 'secondary_tag', attributes: { group: 'content-warnings', name: { en: 'Mild Violence' } } },
                { type: 'tag', attributes: { group: 'admin-only', name: { en: "Nami's TT Gold Winner", ja: 'ナミのTTゴールドウィナー' } } },
                { type: 'tag', attributes: { group: 'theme', name: { en: 'Vampires', ja: 'バンパイア' } } }
            ]
        };
        addTitleTags(sampleTitle, embed, translations, 'namicomi', 'ja');
        expect(embed.addFields).toHaveBeenCalledWith([
            { name: 'Format', value: 'ウェブトゥーン', inline: true },
            { name: 'Genres', value: 'ロマンス', inline: true },
            { name: 'Themes', value: 'バンパイア', inline: true },
            { name: 'Content Warning', value: 'Mild Violence', inline: true },
            { name: 'Other', value: 'ナミのTTゴールドウィナー', inline: true }
        ]);
    });
});
