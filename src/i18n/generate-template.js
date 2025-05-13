import fs from 'fs/promises';
import path from 'path';

console.log('Generating template.json from en.json...');
const src = path.join(process.cwd(), './src/i18n/locales/en.json');
const raw = JSON.parse(await fs.readFile(src, 'utf8'));

raw.locale = {
    name: '',
    english: '',
    code: ''
};

const dest = path.join(process.cwd(), './src/i18n/template.json');
await fs.writeFile(dest, JSON.stringify(raw, null, 2) + '\n', 'utf8');

console.log(`✅ Generated template.json from en.json (metadata preserved in en.json)`);