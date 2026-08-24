import fs from "fs";
import path from "path";
import "dotenv/config";
import enStrings from "../src/i18n/locales/en";

const tempDir = "./.i18n-temp";
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const locales = ["es", "eu", "ja"];
const WEBLATE_TOKEN = process.env.WEBLATE_TOKEN;

function mapTranslations(base: any, translated: any): any {
  if (typeof base === "boolean") {
    return translated === "true" || translated === true;
  }
  if (typeof base === "number") {
    return Number(translated);
  }

  // If we reach a leaf node (string)
  if (typeof base !== "object" || base === null) {
    // Drop empty strings and nulls from Weblate
    if (translated === "" || translated === null || translated === undefined) {
      return undefined;
    }
    return translated;
  }

  const result: any = {};
  for (const key of Object.keys(base)) {
    if (translated && translated[key] !== undefined) {
      const mapped = mapTranslations(base[key], translated[key]);

      // Only assign the key if it has actual translated content
      if (mapped !== undefined) {
        result[key] = mapped;
      }
    }
  }

  // If the object ended up completely empty (no translated children), drop the object entirely
  if (Object.keys(result).length === 0) {
    return undefined;
  }

  return result;
}

async function pullFromWeblate() {
  for (const locale of locales) {
    const jsonPath = path.join(tempDir, `${locale}.json`);

    // 1. Download the JSON from Weblate
    if (WEBLATE_TOKEN) {
      console.log(`Downloading ${locale} from Weblate...`);
      const res = await fetch(
        `https://weblate.tr25.es/api/translations/dexchan/discord-bot/${locale}/file/`,
        {
          headers: { Authorization: `Token ${WEBLATE_TOKEN}` },
        }
      );

      if (!res.ok) {
        console.warn(
          `Failed to pull ${locale} (${res.status}). Skipping download.`
        );
      } else {
        const text = await res.text();
        fs.writeFileSync(jsonPath, text);
      }
    }

    // 2. Map and compile to TS
    if (!fs.existsSync(jsonPath)) continue;

    const rawTranslation = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const orderedTranslationData = mapTranslations(enStrings, rawTranslation);

    const tsContent = `import { PartialBotStrings } from "../schema";\n\nexport default ${JSON.stringify(
      orderedTranslationData,
      null,
      2
    )} satisfies PartialBotStrings;\n`;

    fs.writeFileSync(
      path.join(__dirname, `../src/i18n/locales/${locale}.ts`),
      tsContent
    );
    console.log(`Successfully compiled ${locale}.ts`);
  }
}

pullFromWeblate().catch(console.error);
