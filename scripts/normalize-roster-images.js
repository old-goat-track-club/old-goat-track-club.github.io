#!/usr/bin/env node
/**
 * Normalize roster photos to card resolution with subject-aware cropping.
 *
 * Reads every photo under src/assets/roster-photos/ (and nothing else), and for
 * each requested crop strategy writes a resized JPEG to out/roster-images/. The
 * originals are never modified.
 *
 * Strategies exist so the smart crop can be compared against dumb baselines:
 *   attention  - libvips subject-aware crop (highest salience region)
 *   entropy    - libvips detail-density crop
 *   centre     - geometric centre
 *   north      - top-anchored (strong baseline for portraits)
 *
 * Usage:
 *   node scripts/normalize-roster-images.mjs
 *   node scripts/normalize-roster-images.mjs --strategy attention
 *   node scripts/normalize-roster-images.mjs --width 600 --height 800
 */

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "src/assets/roster-photos";
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
]);
// The fallback avatar lives in the roster folder but is a logo, not a portrait.
// Subject-aware cropping picks an arbitrary region of it, so leave it alone.
const EXCLUDED = new Set(["goat-head.png"]);

const STRATEGIES = {
  attention: sharp.strategy.attention,
  entropy: sharp.strategy.entropy,
  centre: "centre",
  north: "north",
};

const DEFAULTS = {
  strategy: "all",
  width: 640,
  height: 800,
  quality: 82,
  out: "out/roster-images",
};

function usage() {
  console.log(`Normalize roster photos with subject-aware cropping.

Options:
  --strategy <name>   ${Object.keys(STRATEGIES).join(" | ")} | all  (default: all)
  --width <px>        Output width                              (default: ${DEFAULTS.width})
  --height <px>       Output height                             (default: ${DEFAULTS.height})
  --quality <1-100>   JPEG quality                              (default: ${DEFAULTS.quality})
  --out <dir>         Output root                               (default: ${DEFAULTS.out})
  --help              Show this message

Reads:  ${SOURCE_DIR}/**  (originals are never modified)
Writes: <out>/<strategy>/... plus <out>/preview.html
`);
}

function parseArgs(argv) {
  const options = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (!arg.startsWith("--")) continue;

    const [rawKey, inlineValue] = arg.slice(2).split("=");
    const value = inlineValue ?? argv[++i];
    if (value === undefined) {
      throw new Error(`Missing value for --${rawKey}`);
    }

    switch (rawKey) {
      case "strategy":
        options.strategy = value;
        break;
      case "width":
        options.width = Number(value);
        break;
      case "height":
        options.height = Number(value);
        break;
      case "quality":
        options.quality = Number(value);
        break;
      case "out":
        options.out = value;
        break;
      default:
        throw new Error(`Unknown option --${rawKey} (try --help)`);
    }
  }

  const names =
    options.strategy === "all" ? Object.keys(STRATEGIES) : [options.strategy];

  for (const name of names) {
    if (!(name in STRATEGIES)) {
      throw new Error(
        `Unknown strategy "${name}" (expected ${Object.keys(STRATEGIES).join(", ")}, or all)`,
      );
    }
  }

  if (!Number.isFinite(options.width) || !Number.isFinite(options.height)) {
    throw new Error("--width and --height must be numbers");
  }

  return { options, strategies: names };
}

async function findImages(dir) {
  const found = [];
  const skipped = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findImages(full);
      found.push(...nested.found);
      skipped.push(...nested.skipped);
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      if (EXCLUDED.has(entry.name)) {
        skipped.push(full);
      } else {
        found.push(full);
      }
    }
  }
  return { found: found.sort(), skipped };
}

function outputPath(outRoot, strategy, file) {
  const relative = path.relative(SOURCE_DIR, file);
  return path.join(outRoot, strategy, relative.replace(/\.[^.]+$/, ".jpg"));
}

async function normalize({ file, strategy, position, options }) {
  const destination = outputPath(options.out, strategy, file);
  await mkdir(path.dirname(destination), { recursive: true });

  const buffer = await sharp(file)
    .rotate()
    .resize(options.width, options.height, { fit: "cover", position })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: options.quality, mozjpeg: true })
    .toBuffer();

  await writeFile(destination, buffer);
  return { destination, bytes: buffer.length };
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPreview({ files, rows, strategies, options }) {
  const ids = new Set(rows.map((row) => row.strategy));
  const present = strategies.filter((s) => ids.has(s));

  const cells = (file) => {
    const relative = path.relative(SOURCE_DIR, file);
    const originalHref = path.relative(
      options.out,
      path.join(SOURCE_DIR, relative),
    );
    return [
      `<figure class="cell"><img src="${escapeHtml(originalHref)}" alt="${escapeHtml(relative)} original"><figcaption>original</figcaption></figure>`,
      ...present.map((strategy) => {
        const entry = rows.find(
          (r) => r.file === file && r.strategy === strategy,
        );
        if (!entry || entry.error) {
          return `<figure class="cell missing"><figcaption>${escapeHtml(strategy)}: ${escapeHtml(entry?.error ?? "not generated")}</figcaption></figure>`;
        }
        const href = path.relative(options.out, entry.destination);
        return `<figure class="cell"><img src="${escapeHtml(href)}" alt="${escapeHtml(relative)} ${escapeHtml(strategy)}"><figcaption>${escapeHtml(strategy)} · ${Math.round(entry.bytes / 1024)} KB</figcaption></figure>`;
      }),
    ].join("\n");
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Roster photo crop preview</title>
    <style>
      body { font: 14px/1.5 system-ui, sans-serif; margin: 2rem; background: #f6f6f6; }
      h1 { font-size: 1.2rem; }
      p { max-width: 60ch; }
      .row { margin-bottom: 2rem; }
      .row h2 { font-size: 0.95rem; margin: 0 0 0.5rem; font-weight: 600; }
      .cells { display: flex; gap: 1rem; flex-wrap: wrap; }
      /* Mirrors .athlete-photo in src/styles.css so the crop reads like production. */
      .cell { margin: 0; width: 300px; }
      .cell img { display: block; width: 100%; height: 320px; object-fit: cover; object-position: center 22%; border-radius: 8px; background: #fff; }
      .cell figcaption { font-size: 0.75rem; color: #555; padding-top: 0.25rem; }
      .missing { display: flex; align-items: center; justify-content: center; height: 320px; border: 1px dashed #bbb; border-radius: 8px; }
    </style>
  </head>
  <body>
    <h1>Roster photo crop preview</h1>
    <p>
      Each row is one source photo. Cards are 300&times;320 with
      <code>object-fit: cover; object-position: center 22%</code>, the same as
      <code>.athlete-photo</code>. Generated at ${options.width}&times;${options.height},
      quality ${options.quality}.
    </p>
    ${files
      .map((file) => {
        const relative = path.relative(SOURCE_DIR, file);
        return `<section class="row"><h2>${escapeHtml(relative)}</h2><div class="cells">${cells(file)}</div></section>`;
      })
      .join("\n")}
  </body>
</html>
`;
}

async function main() {
  const { options, strategies } = parseArgs(process.argv.slice(2));
  const { found: files, skipped } = await findImages(SOURCE_DIR);

  if (files.length === 0) {
    throw new Error(`No images found under ${SOURCE_DIR}`);
  }

  if (skipped.length > 0) {
    for (const file of skipped) {
      console.log(`Skipping (excluded): ${path.relative(".", file)}`);
    }
    console.log("");
  }

  console.log(
    `Normalizing ${files.length} photos to ${options.width}x${options.height} @ q${options.quality}`,
  );
  console.log(`Strategies: ${strategies.join(", ")}\n`);

  const rows = [];
  for (const strategy of strategies) {
    const position = STRATEGIES[strategy];
    let beforeTotal = 0;
    let afterTotal = 0;
    let failures = 0;

    for (const file of files) {
      const { size: before } = await stat(file);
      try {
        const { destination, bytes } = await normalize({
          file,
          strategy,
          position,
          options,
        });
        rows.push({ file, strategy, destination, bytes, before });
        beforeTotal += before;
        afterTotal += bytes;
        console.log(
          `  ${strategy.padEnd(9)} ${path.relative(SOURCE_DIR, file).padEnd(42)} ${Math.round(
            before / 1024,
          )
            .toString()
            .padStart(4)} KB -> ${Math.round(bytes / 1024)
            .toString()
            .padStart(3)} KB`,
        );
      } catch (error) {
        failures++;
        rows.push({ file, strategy, error: error.message.split("\n")[0] });
        console.log(
          `  ${strategy.padEnd(9)} ${path.relative(SOURCE_DIR, file).padEnd(42)} FAILED: ${error.message.split("\n")[0]}`,
        );
      }
    }

    const saved = beforeTotal > 0 ? 100 - (afterTotal / beforeTotal) * 100 : 0;
    console.log(
      `\n${strategy}: ${(beforeTotal / 1024 / 1024).toFixed(1)} MB -> ${(afterTotal / 1024 / 1024).toFixed(1)} MB (${saved.toFixed(0)}% smaller), ${failures} failure(s)\n`,
    );
  }

  const previewPath = path.join(options.out, "preview.html");
  await mkdir(options.out, { recursive: true });
  await writeFile(
    previewPath,
    renderPreview({ files, rows, strategies, options }),
  );

  console.log(`Preview: ${previewPath}`);
  console.log("Originals were not modified.");
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
