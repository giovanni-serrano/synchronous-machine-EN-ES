/**
 * Renders the Open Graph card (?view=og) at 1200 × 630 and saves it to public/og.png.
 *
 *   npm run og        (uses the dev server at http://localhost:5173/ unless a URL is given)
 */

import { chromium } from 'playwright-core';

const [base = 'http://localhost:5173/', out = 'public/og.png'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: process.env.CAPTURE_CHANNEL ?? 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`${base}?view=og&lang=en`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log(`wrote ${out}`);
