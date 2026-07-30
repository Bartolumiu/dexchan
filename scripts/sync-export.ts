import fs from "fs";
import path from "path";
import "dotenv/config";
import enStrings from "../src/i18n/locales/en";

const tempDir = "./.i18n-temp";
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const jsonPath = path.join(tempDir, "en.json");
fs.writeFileSync(jsonPath, JSON.stringify(enStrings, null, 2));
console.log("Successfully extracted TypeScript to JSON.");

const WEBLATE_TOKEN = process.env.WEBLATE_TOKEN;

async function pushToWeblate() {
  if (!WEBLATE_TOKEN) {
    console.warn("Missing WEBLATE_TOKEN in .env. Skipping upload.");
    return;
  }

  const fileBlob = new Blob([fs.readFileSync(jsonPath)]);
  const formData = new FormData();
  formData.append("file", fileBlob, "en.json");
  formData.append("method", "replace");

  console.log("Pushing source strings to Weblate...");
  const res = await fetch(
    "https://weblate.tr25.es/api/translations/dexchan/discord-bot/en/file/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${WEBLATE_TOKEN}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Weblate upload failed (${res.status}): ${errText}`);
  }

  console.log("Successfully pushed en.json to Weblate.");
}

pushToWeblate().catch(console.error);
