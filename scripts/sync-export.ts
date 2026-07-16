import fs from "fs";
import path from "path";
import enStrings from "../src/i18n/locales/en";

const tempDir = "./.i18n-temp";
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Just write the file. The CLI will pick it up.
fs.writeFileSync(
  path.join(tempDir, "en.json"),
  JSON.stringify(enStrings, null, 2)
);
console.log("Successfully extracted TypeScript to JSON for Tolgee CLI.");
