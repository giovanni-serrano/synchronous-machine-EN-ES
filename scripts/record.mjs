/**
 * Records short videos of the star moments for reviews and social posts.
 *
 *   node scripts/record.mjs <baseUrl> <outDir> [lang] [mode]
 *
 * mode "hook" (default): the hook loop on its square stage (?view=hook-clip), one full loop, 1080 × 1080 —
 *   the main clip for X.
 * mode "three-coils": §3 on a phone screen — the components pulse, slide tip to tail, the sum turns; coil b is switched
 *   off (ellipse) and back on.
 * mode "poles": §4 — 2 → 4 → 6 → 8 poles, the same currents, a slower field each time.
 * mode "rotor": §5 — the rotor is dragged away and springs back; then dragged past 180° and slips a pole.
 * mode "load": §6 — δ is dragged along the power curve from 10° to 85° and back to 41°: the field lines stretch.
 * mode "motor-gen": §7 — δ crosses zero: motor → generator, the energy reverses.
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

/** A phone-sized recording centred on one section's figure; `act` gets the canvas box. */
async function recordSection(id, name, act) {
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
  await page.evaluate((sel) => {
    const c = document.querySelector(sel);
    const r = c.getBoundingClientRect();
    window.scrollBy(0, r.top - (window.innerHeight - r.height) / 2 + 30);
  }, `#${id} canvas`);
  await page.waitForTimeout(1500);
  const box = await page.locator(`#${id} canvas`).boundingBox();
  await act(page, box);
  return { context, page, name };
}

/** Smooth pointer drag through a list of points. */
async function drag(page, points, stepMs = 16) {
  await page.mouse.move(points[0][0], points[0][1]);
  await page.mouse.down();
  for (let k = 1; k < points.length; k++) {
    await page.mouse.move(points[k][0], points[k][1]);
    await page.waitForTimeout(stepMs);
  }
  await page.mouse.up();
}

/** Points along the power curve of §6/§7 (portrait layout: strip from 0.10 w to 0.92 w, centred at 1.035 w). */
function curvePoints(box, fromFrac, toFrac, n = 90) {
  const x0 = box.x + 0.1 * box.width;
  const x1 = box.x + 0.92 * box.width;
  const y = box.y + 1.035 * box.width;
  return Array.from({ length: n + 1 }, (_, k) => [x0 + (x1 - x0) * (fromFrac + ((toFrac - fromFrac) * k) / n), y]);
}

/** Points on a circle inside the bore of a square figure, sweeping by `sweep` rad from `start`. */
function arcPoints(box, start, sweep, n = 60) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = box.width * 0.2;
  return Array.from({ length: n + 1 }, (_, k) => {
    const a = start + (sweep * k) / n;
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  });
}

const modes = {
  hook: recordHook,
  'three-coils': recordThreeCoils,
  poles: () =>
    recordSection('poles', `poles-${lang}.webm`, async (page) => {
      await page.waitForTimeout(3500);
      await page.locator('#poles canvas').focus();
      for (let k = 0; k < 3; k++) {
        await page.keyboard.press('+');
        await page.waitForTimeout(4500);
      }
    }),
  rotor: () =>
    recordSection('rotor', `rotor-${lang}.webm`, async (page, box) => {
      await page.waitForTimeout(2500);
      await drag(page, arcPoints(box, 0, -1.6, 50), 20); // pull it back ~90° and let go
      await page.waitForTimeout(5000);
      await drag(page, arcPoints(box, 0, -3.8, 90), 16); // past 180°: it slips a pole and locks on again
      await page.waitForTimeout(6000);
    }),
  load: () =>
    recordSection('load', `load-${lang}.webm`, async (page, box) => {
      await page.waitForTimeout(2500);
      await drag(page, curvePoints(box, 0.23, 0.055, 30), 30); // from 41° down to 10°
      await page.waitForTimeout(1500);
      await drag(page, curvePoints(box, 0.055, 0.47, 140), 30); // up to 85°
      await page.waitForTimeout(2000);
      await drag(page, curvePoints(box, 0.47, 0.23, 80), 30); // back to 41°
      await page.waitForTimeout(2500);
    }),
  'motor-gen': () =>
    recordSection('motor-or-generator', `motor-gen-${lang}.webm`, async (page, box) => {
      await page.waitForTimeout(2500);
      await drag(page, curvePoints(box, 0.33, 0.78, 160), 35); // from −41° (motor) to +60° (generator)
      await page.waitForTimeout(3000);
      await drag(page, curvePoints(box, 0.78, 0.33, 120), 30); // and back
      await page.waitForTimeout(2500);
    }),
};
if (!modes[mode]) throw new Error(`unknown mode ${mode}: ${Object.keys(modes).join(', ')}`);
const { context, page, name } = await modes[mode]();
const video = page.video();
await context.close();
const target = join(out, name);
renameSync(await video.path(), target);
await browser.close();
console.log(`wrote ${target}`);
