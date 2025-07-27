const setImages = require('../../../src/functions/titles/setImages');
const getTitleCreators = require('../../../src/functions/titles/titleCreators');
const getCover = require('../../../src/functions/titles/titleCover');
const getBanner = require('../../../src/functions/titles/titleBanner');

jest.mock('../../../src/functions/titles/titleCreators');
jest.mock('../../../src/functions/titles/titleCover');
jest.mock('../../../src/functions/titles/titleBanner');
jest.mock('discord.js', () => {
    const actual = jest.requireActual('discord.js');
    return {
        ...actual,
        AttachmentBuilder: jest.fn((data, opts) => ({ data, ...opts }))
    };
});

describe('setImages', () => {
    let embed;
    beforeEach(() => {
        embed = {
            setAuthor: jest.fn(),
            setThumbnail: jest.fn(),
            setImage: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('mangadex', () => {
        it('should use unknown_author translation if getTitleCreators returns falsy', async () => {
            getTitleCreators.mockReturnValue(null);
            getCover.mockResolvedValue(null);
            const translations = { embed: { error: { unknown_author: 'Unknown Author', too_many_authors: 'Too many authors' } } };
            const result = await setImages({}, embed, 'mangadex', translations);
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Unknown Author', iconURL: 'attachment://mangadex.png' });
            expect(result[0].data).toContain('mangadex.png');
        });

        it('should use too_many_authors translation if getTitleCreators returns a long string', async () => {
            getTitleCreators.mockReturnValue('a'.repeat(300));
            getCover.mockResolvedValue(null);
            const translations = { embed: { error: { unknown_author: 'Unknown Author', too_many_authors: 'Too many authors' } } };
            const result = await setImages({}, embed, 'mangadex', translations);
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Too many authors', iconURL: 'attachment://mangadex.png' });
            expect(result[0].data).toContain('mangadex.png');
        });
        it('should set author and return only icon if no cover', async () => {
            getTitleCreators.mockReturnValue('Author');
            getCover.mockResolvedValue(null);
            const translations = { embed: { error: { no_authors: 'No authors', too_many_authors: 'Too many authors' } } };
            const result = await setImages({}, embed, 'mangadex', { translations });
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Author', iconURL: 'attachment://mangadex.png' });
            expect(result[0].data).toContain('mangadex.png');
            expect(result.length).toBe(1);
        });

        it('should set author, thumbnail, and return icon and cover if cover exists', async () => {
            getTitleCreators.mockReturnValue('Author');
            getCover.mockResolvedValue(Buffer.from([1,2,3]));
            const translations = { embed: { error: { no_authors: 'No authors', too_many_authors: 'Too many authors' } } };
            const result = await setImages({}, embed, 'mangadex', { translations });
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Author', iconURL: 'attachment://mangadex.png' });
            expect(embed.setThumbnail).toHaveBeenCalledWith('attachment://cover.jpg');
            expect(result.length).toBe(2);
            expect(result[1].name).toBe('cover.jpg');
        });
    });

    describe('namicomi', () => {
        it('should use unknown_author translation if getTitleCreators returns falsy', async () => {
            getTitleCreators.mockReturnValue(null);
            getCover.mockResolvedValue(null);
            const translations = { embed: { error: { unknown_author: 'Unknown Author', too_many_authors: 'Too many authors' } } };
            const result = await setImages({}, embed, 'namicomi', translations);
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Unknown Author', iconURL: 'attachment://namicomi.png' });
            expect(result[0].data).toContain('namicomi.png');
        });

        it('should use too_many_authors translation if getTitleCreators returns a long string', async () => {
            getTitleCreators.mockReturnValue('a'.repeat(300));
            getCover.mockResolvedValue(null);
            const translations = { embed: { error: { unknown_author: 'Unknown Author', too_many_authors: 'Too many authors' } } };
            const result = await setImages({}, embed, 'namicomi', translations);
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Too many authors', iconURL: 'attachment://namicomi.png' });
            expect(result[0].data).toContain('namicomi.png');
            expect(result.length).toBe(1);
        });

        it('should set author and return only icon if no cover', async () => {
            getTitleCreators.mockReturnValue('Author');
            getCover.mockResolvedValue(null);
            const result = await setImages({}, embed, 'namicomi', { locale: 'en' });
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Author', iconURL: 'attachment://namicomi.png' });
            expect(result[0].data).toContain('namicomi.png');
            expect(result.length).toBe(1);
        });

        it('should set author, thumbnail, and return icon and cover if cover exists but no banner', async () => {
            getTitleCreators.mockReturnValue('Author');
            getCover.mockResolvedValue(Buffer.from([1,2,3]));
            getBanner.mockResolvedValue(null);
            const result = await setImages({}, embed, 'namicomi', { locale: 'en' });
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Author', iconURL: 'attachment://namicomi.png' });
            expect(embed.setThumbnail).toHaveBeenCalledWith('attachment://cover.jpg');
            expect(result.length).toBe(2);
            expect(result[1].name).toBe('cover.jpg');
        });

        it('should set author, thumbnail, image, and return icon, cover, and banner if all exist', async () => {
            getTitleCreators.mockReturnValue('Author');
            getCover.mockResolvedValue(Buffer.from([1,2,3]));
            getBanner.mockResolvedValue(Buffer.from([4,5,6]));
            const result = await setImages({}, embed, 'namicomi', { locale: 'en' });
            expect(embed.setAuthor).toHaveBeenCalledWith({ name: 'Author', iconURL: 'attachment://namicomi.png' });
            expect(embed.setThumbnail).toHaveBeenCalledWith('attachment://cover.jpg');
            expect(embed.setImage).toHaveBeenCalledWith('attachment://banner.jpg');
            expect(result.length).toBe(3);
            expect(result[2].name).toBe('banner.jpg');
        });
    });

    it('should return an empty array for unsupported type', async () => {
        const result = await setImages({}, {}, 'unsupported', {});
        expect(result).toEqual([]);
    });
});
