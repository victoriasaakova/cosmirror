#!/usr/bin/env node
/**
 * Bake web-ready WebP (and OG JPEG) from source PNGs in assets/image-sources.
 * Keeps visual quality high while cutting payload for mobile.
 *
 * Usage: npm run optimize-images
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets", "image-sources");
const IMG = path.join(ROOT, "public", "images");

/** @type {{ src: string, out: string, maxWidth: number, quality: number }[]} */
const TARGETS = [
  // Full-bleed scenes — keep detail, cap width for retina phones/desktops
  { src: "hero-coastal-moon-trail_4.png", out: "hero-coastal-moon-trail_4.webp", maxWidth: 1600, quality: 86 },
  { src: "landscape_stars.png", out: "landscape_stars.webp", maxWidth: 1600, quality: 84 },
  { src: "landscape_natal_map_2.png", out: "landscape_natal_map_2.webp", maxWidth: 1600, quality: 84 },

  // Eye mark ~14rem / 42vw → 512px covers 3x retina
  { src: "eye-silver.png", out: "eye-silver.webp", maxWidth: 512, quality: 90 },

  // Familiar cards icons — displayed ~56px
  { src: "spiral.png", out: "spiral.webp", maxWidth: 256, quality: 90 },
  { src: "battery.png", out: "battery.webp", maxWidth: 256, quality: 90 },
  { src: "puzzles.png", out: "puzzles.webp", maxWidth: 256, quality: 90 },

  // How-it-works illustrations — displayed ~196px
  { src: "planet.png", out: "planet.webp", maxWidth: 512, quality: 88 },
  { src: "flower.png", out: "flower.webp", maxWidth: 512, quality: 88 },
  { src: "pattern.png", out: "pattern.webp", maxWidth: 512, quality: 88 },
  { src: "moon.png", out: "moon.webp", maxWidth: 512, quality: 88 },
];

async function convertOne({ src, out, maxWidth, quality }) {
  const input = path.join(SRC, src);
  const output = path.join(IMG, out);
  if (!fs.existsSync(input)) {
    console.warn(`skip missing: ${src}`);
    return;
  }

  const before = fs.statSync(input).size;
  const image = sharp(input).rotate();
  const meta = await image.metadata();
  const width = meta.width && meta.width > maxWidth ? maxWidth : meta.width;

  await image
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6, alphaQuality: 100 })
    .toFile(output);

  const after = fs.statSync(output).size;
  const pct = ((1 - after / before) * 100).toFixed(0);
  console.log(
    `${src} → ${out}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (−${pct}%)`,
  );
}

async function writeOgJpeg() {
  const src = path.join(SRC, "hero-coastal-moon-trail_4.png");
  const out = path.join(IMG, "og-cover.jpg");
  if (!fs.existsSync(src)) return;

  await sharp(src)
    .rotate()
    .resize({ width: 1200, height: 630, fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);

  console.log(`og-cover.jpg: ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.log(`No sources at ${SRC} — keeping existing public/images (ok for deploy).`);
    return;
  }
  for (const t of TARGETS) {
    await convertOne(t);
  }
  await writeOgJpeg();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
