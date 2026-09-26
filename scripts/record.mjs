/**
 * Records a short phone-sized video of a star moment for reviews / social previews.
 *
 *   node scripts/record.mjs <baseUrl> <outDir> [lang]
 *
 * Current script: §3 "three pulses become one rotation" — the sum turns and draws its circle, coil b is switched off
 * (the circle collapses into an ellipse) and back on. Needs Playwright's ffmpeg once: `npx playwright-core install ffmpeg`.
 */

import { mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const [base = 'http://localhost:5173/', out = 'captures', lang = 'en'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CAPTURE_CHANNEL ?? 'msedge', headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  recordVideo: { dir: out, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
await page.goto(`${base}?lang=${lang}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const fig = page.locator('#three-coils canvas');
await fig.scrollIntoViewIfNeeded();
await page.evaluate(() => {
  const c = document.querySelector('#three-coils canvas');
  const r = c.getBoundingClientRect();
  window.scrollBy(0, r.top - (window.innerHeight - r.height) / 2 + 40);
});
await page.waitForTimeout(7000); // one full turn draws the circle
await fig.focus();
await page.keyboard.press('2'); // coil b off → ellipse
await page.waitForTimeout(7000);
await page.keyboard.press('2'); // back on → circle
await page.waitForTimeout(5000);
const video = page.video();
await context.close();
const path = await video.path();
const target = join(out, `star-three-coils-${lang}.webm`);
renameSync(path, target);
await browser.close();
console.log(`wrote ${target}`);
