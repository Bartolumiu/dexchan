import fs from "fs";
import path from "path";
import enStrings from "../src/i18n/locales/en";

const tempDir = "./.i18n-temp";
const locales = ["es", "eu", "ja"];

function mapTranslations(base: any, translated: any): any {
  if (typeof base === "boolean") {
    return translated === "true" || translated === true;
  }
  if (typeof base === "number") {
    return Number(translated);
  }

  if (typeof base !== "object" || base === null) {
    return translated !== undefined ? translated : base;
  }

  const result: any = {};
  for (const key of Object.keys(base)) {
    if (translated && translated[key] !== undefined) {
      result[key] = mapTranslations(base[key], translated[key]);
    }
  }
  return result;
}

locales.forEach((locale) => {
  const jsonPath = path.join(tempDir, `${locale}.json`);
  if (!fs.existsSync(jsonPath)) return;

  const rawTranslation = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const orderedTranslationData = mapTranslations(enStrings, rawTranslation);
  const tsContent = `import { PartialBotStrings } from "../schema";\n\nexport default ${JSON.stringify(orderedTranslationData, null, 2)} satisfies PartialBotStrings;\n`;

  fs.writeFileSync(
    path.join(__dirname, `../src/i18n/locales/${locale}.ts`),
    tsContent
  );
  console.log(`Successfully compiled ${locale}.ts`);
});
