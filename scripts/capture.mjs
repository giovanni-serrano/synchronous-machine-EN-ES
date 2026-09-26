/**
 * Screenshots for reviews: phone (390 × 844 @2x) and desktop (1440 × 900), EN and ES, full page plus the first screen.
 *
 *   node scripts/capture.mjs <baseUrl> <outDir> [query]
 *
 * Uses playwright-core with the locally installed Microsoft Edge (or Chrome with CAPTURE_CHANNEL=chrome) —
 * no browser download needed.
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const [base = 'http://localhost:5173/', out = 'captures', query = ''] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CAPTURE_CHANNEL ?? 'msedge', headless: true });

const devices = [
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];

for (const lang of ['en', 'es'])
  for (const dev of devices) {
    const { name, ...opts } = dev;
    const page = await browser.newPage(opts);
    await page.goto(`${base}?lang=${lang}${query}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(out, `${name}-${lang}-first.png`) });
    // walk down so every figure starts animating, then capture the whole page
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 600) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(out, `${name}-${lang}-full.png`), fullPage: true });
    await page.close();
    console.log(`${name}-${lang}`);
  }
await browser.close();
