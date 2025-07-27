const os = require('os');
const fs = require('fs/promises');
const path = require('path');

const { generateTemplate } = require('../../src/i18n/generate-template.js');

describe('generateTemplate()', () => {
    let tmpDir, localesDir, templatePath;

    beforeAll(() => {
        // Silence console logs
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    beforeEach(async () => {
        // Create a temporary directory for testing
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gtpl-'));
        localesDir = path.join(tmpDir, 'src', 'i18n', 'locales');
        await fs.mkdir(localesDir, { recursive: true });

        // Precompute paths for the test
        templatePath = path.join(tmpDir, 'src', 'i18n', 'template.json');
    });

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('should log progress, read en.json, inject locale stub, and write template.json', async () => {
        const en = { foo: 'bar', bar: 123 };
        await fs.writeFile(path.join(localesDir, 'en.json'), JSON.stringify(en), 'utf8');
        const { srcPath, destPath, json } = await generateTemplate({ cwd: tmpDir });

        expect(srcPath).toBe(path.join(localesDir, 'en.json'));
        expect(destPath).toBe(templatePath);

        const parsed = JSON.parse(json);
        expect(parsed).toEqual({
            foo: 'bar',
            bar: 123,
            locale: { enabled: false, name: '', englishName: '', code: '' }
        });
        expect(json.endsWith('\n')).toBe(true);

        const disk = JSON.parse(await fs.readFile(templatePath, 'utf8'));
        expect(disk).toEqual(parsed);
    });

    it('should throw an error if en.json is not found', async () => {
        await expect(generateTemplate({ cwd: tmpDir })).rejects.toThrow();
    });

    it('should throw an error if template.json cannot be written', async () => {
        await fs.writeFile(path.join(localesDir, 'en.json'), JSON.stringify({}), 'utf8');

        const realFile = fs.writeFile;
        fs.writeFile = () => Promise.reject(new Error('boom'));
        await expect(generateTemplate({ cwd: tmpDir })).rejects.toThrow('boom');
        fs.writeFile = realFile;
    });
});