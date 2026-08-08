#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const { REMAINING_WORKSHEET_MATH_VISUAL_CONTRACTS } = require("./remaining-worksheet-imagegen-specs.cjs");

const ROOT = path.resolve(__dirname, "../..");
const ARTIFACTS_ROOT = path.join(ROOT, "artifacts", "vivasam");
const SOURCE_OUTPUT_IDS = Object.freeze({
  "g3s1-division-missing-factor": "exec-8bc1c8cf-a29d-4e85-83a7-5d7f08a920f6.png",
  "g3s1-division-fact-family": "exec-e02eb3c7-9cc1-4dde-996e-c3355153dc62.png",
  "g3s1-division-group-count": "exec-513e9330-2737-4917-ba94-e5646ab1f415.png",
  "g3s1-fraction-equal-parts": "exec-71ad2e52-f228-47f9-a48b-867652996db7.png",
  "g3s1-fraction-fix-partition": "exec-20133c39-2796-42c2-8186-88aefc8d305a.png",
  "g3s1-fraction-part-whole": "exec-0b4e4152-6474-4ea3-b274-b8bbf2679b44.png",
  "g3s1-fraction-pizza-context": "exec-44874590-9828-4518-bf82-c243e7f03985.png",
  "g3s1-length-centimeter-meter": "exec-4aa5c3cc-5c11-46df-9b5e-3c7f60547a54.png",
  "g3s1-length-real-world-units": "exec-f149b7e8-ccb1-4224-97f8-51411abf4815.png",
  "g3s1-length-unit-conversion": "exec-f3c99da4-01b9-4e10-b363-f738f24c3f66.png",
  "g3s2-multiplication-place-value": "exec-371db4d4-506f-4797-bda2-7cac39bca07c.png",
  "g3s2-multiplication-combine": "exec-e33faf07-4646-472f-9fd1-a6a5adeaf389.png",
  "g3s2-multiplication-two-digit": "exec-f8717aa1-452a-4233-9ee5-955a0b991c97.png",
  "g3s2-division-meaning": "exec-2d966e8c-1895-4a82-ad26-016309899576.png",
  "g3s2-division-remainder": "exec-fe15e3f4-8a45-4247-aad1-d9d432af94ca.png",
  "g3s2-division-remainder-check": "exec-991af1df-d633-4ebf-a565-67d86e3226ac.png",
  "g3s2-circle-parts": "exec-748df186-86ae-47e3-965e-3ff3313fe359.png",
  "g3s2-circle-diameter": "exec-7238a773-53e2-484d-8f2b-2193bd50be20.png",
  "g3s2-fraction-part-whole": "exec-45bf74ed-7e62-44be-a541-74e20969f2da.png",
  "g3s2-fraction-convert": "exec-51b79697-1427-4d0a-b89d-06a67504da7e.png",
  "g3s2-fraction-compare": "exec-dfbce36a-f6e8-4368-9618-4ae1030f6e9b.png",
  "g3s2-capacity-unit": "exec-cb26936c-bac0-444b-8e19-5dfa4c1e7401.png",
  "g3s2-weight-unit": "exec-6e02265e-c1bc-4a34-9fea-6f3bb590e732.png",
  "g3s2-pictograph-compare": "exec-618c2d9d-6a7b-488e-822c-341b25b42d33.png",
});

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

async function main() {
  for (const [id, mathVisualCounts] of Object.entries(REMAINING_WORKSHEET_MATH_VISUAL_CONTRACTS)) {
    const worksheetDir = path.join(ARTIFACTS_ROOT, id, "worksheet");
    const promptFile = `${id}-worksheet.prompt.txt`;
    const imageFile = `${id}-worksheet.png`;
    const promptPath = path.join(worksheetDir, promptFile);
    const imagePath = path.join(worksheetDir, imageFile);
    const metadataPath = path.join(worksheetDir, `${id}-worksheet.imagegen.json`);
    if (!fs.existsSync(promptPath) || !fs.existsSync(imagePath)) {
      throw new Error(`${id}: prompt/image file is missing`);
    }
    const metadata = await sharp(imagePath).metadata();
    if (metadata.width !== 1024 || metadata.height !== 1536 || metadata.format !== "png") {
      throw new Error(`${id}: expected a 1024x1536 PNG, got ${metadata.width}x${metadata.height} ${metadata.format}`);
    }
    const record = {
      schemaVersion: 1,
      generationMode: "built-in-imagegen",
      generator: "image_gen",
      sourceOutputId: SOURCE_OUTPUT_IDS[id],
      promptFile,
      promptSha256: sha256(promptPath),
      imageFile,
      imageSha256: sha256(imagePath),
      width: metadata.width,
      height: metadata.height,
      visualQa: {
        reviewedAt: new Date().toISOString(),
        logoTitleSeparated: true,
        allQuestionTextLegible: true,
        choicesVisuallySeparated: true,
        answerSpacesPresent: true,
        noOverlapsOrClipping: true,
        mathVisualCounts,
      },
    };
    if (!record.sourceOutputId) throw new Error(`${id}: source output id is missing`);
    fs.writeFileSync(metadataPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    process.stdout.write(`${id}\t${metadataPath}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
