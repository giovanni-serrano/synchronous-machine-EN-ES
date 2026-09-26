/**
 * Records short videos of the star moments for reviews and social posts.
 *
 *   node scripts/record.mjs <baseUrl> <outDir> [lang] [mode]
 *
 * mode "hook" (default): the hook loop on its square stage (?view=hook-clip), one full loop, 1080 × 1080 —
 *   the main clip for X.
 * mode "three-coils": §3 on a phone screen — the components pulse, slide tip to tail, the sum turns; coil b is switched
 *   off (ellipse) and back on.
 *
 * Output is WebM (VP8): Playwright's bundled ffmpeg (`npx playwright-core install ffmpeg`, once) has no H.264 encoder;
 * convert with a full ffmpeg for X: ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p -crf 18 out.mp4
 */

import { mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const HOOK_LOOP_S = 22; // keep in sync with src/essay/figures/hookSequence.ts (HOOK_LOOP_S)
const [base = 'http://localhost:5173/', out = 'captures', lang = 'en', mode = 'hook'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CAPTURE_CHANNEL ?? 'msedge', headless: true });

async function recordHook() {
  const context = await browser.newContext({
    viewport: { width: 540, height: 540 },
    deviceScaleFactor: 2,
    recordVideo: { dir: out, size: { width: 1080, height: 1080 } },
  });
  const page = await context.newPage();
  await page.goto(`${base}?view=hook-clip&lang=${lang}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(HOOK_LOOP_S * 1000 + 800);
  return { context, page, name: `hook-loop-${lang}.webm` };
}

async function recordThreeCoils() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: out, size: { width: 780, height: 1688 } },
  });
  const page = await context.newPage();
  await page.goto(`${base}?lang=${lang}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const c = document.querySelector('#three-coils canvas');
    const r = c.getBoundingClientRect();
    window.scrollBy(0, r.top - (window.innerHeight - r.height) / 2 + 40);
  });
  await page.waitForTimeout(12000); // pulses on their own axes, then the slide and one full turn
  const fig = page.locator('#three-coils canvas');
  await fig.focus();
  await page.keyboard.press('2'); // coil b off → ellipse
  await page.waitForTimeout(7000);
  await page.keyboard.press('2'); // back on → circle
  await page.waitForTimeout(4000);
  return { context, page, name: `three-coils-${lang}.webm` };
}

const { context, page, name } = mode === 'three-coils' ? await recordThreeCoils() : await recordHook();
const video = page.video();
await context.close();
const target = join(out, name);
renameSync(await video.path(), target);
await browser.close();
console.log(`wrote ${target}`);
