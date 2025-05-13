const fs = require('fs/promises');
const path = require('path');

const generateTemplate = async ({ cwd }) => {
    const src = path.join(cwd, './src/i18n/locales/en.json');
    let raw;
    try {
        raw = JSON.parse(await fs.readFile(src, 'utf8'));
    } catch (err) {
        console.error('❌ Error accessing en.json:', err);
        throw err;
    }

    raw.locale = {
        name: '',
        english: '',
        code: ''
    };

    const dest = path.join(cwd, './src/i18n/template.json');
    try {
        await fs.writeFile(dest, JSON.stringify(raw, null, 2) + '\n', 'utf8');
    } catch (err) {
        console.error('❌ Error writing template.json:', err);
        throw err;
    }

    return {
        srcPath: src,
        destPath: dest,
        json: JSON.stringify(raw, null, 2) + '\n'
    };
}

generateTemplate({ cwd: process.cwd() })
    .then(() => {
        console.log('✅ Generated template.json from en.json (metadata preserved in en.json)');
    });

module.exports = {
    generateTemplate
};