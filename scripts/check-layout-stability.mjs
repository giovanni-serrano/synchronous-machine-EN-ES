/**
 * Layout-stability test (docs/experience-redesign.md §4): no animation may move the page.
 *
 *   npm run test:layout        (builds, serves dist with `vite preview`, then runs this check)
 *
 * For each view (essay, lab) and viewport (390 × 844 phone, 1280 × 800 desktop): park the scroll at several depths,
 * let the figures animate for SAMPLE_MS, and sample the document height and scrollY every 100 ms. Any change fails,
 * as does horizontal overflow. Uses playwright-core with the installed Edge (CAPTURE_CHANNEL=chrome for Chrome).
 */

import { chromium } from 'playwright-core';
import { preview } from 'vite';

const SAMPLE_MS = Number(process.env.SAMPLE_MS ?? 3000);
const VIEWS = [
  { name: 'essay', query: '?lang=en' },
  { name: 'essay-es', query: '?lang=es' },
  { name: 'lab', query: '?view=lab&lang=en' },
];
const VIEWPORTS = [
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
];

const server = await preview({ preview: { port: 4179, strictPort: true }, logLevel: 'warn' });
const base = server.resolvedUrls?.local[0] ?? 'http://localhost:4179/';
const browser = await chromium.launch({ channel: process.env.CAPTURE_CHANNEL ?? 'msedge', headless: true });
const failures = [];

try {
  for (const view of VIEWS)
    for (const vp of VIEWPORTS) {
      const { name, ...opts } = vp;
      const page = await browser.newPage(opts);
      await page.goto(base + view.query, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (const depth of [0, 0.1, 0.25, 0.4, 0.55, 0.75]) {
        const target = Math.round((total - vp.viewport.height) * depth);
        await page.evaluate((y) => window.scrollTo(0, y), target);
        await page.waitForTimeout(400); // let lazily started figures begin
        const samples = [];
        for (let t = 0; t <= SAMPLE_MS; t += 100) {
          samples.push(
            await page.evaluate(() => ({
              h: document.documentElement.scrollHeight,
              y: Math.round(window.scrollY),
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            })),
          );
          await page.waitForTimeout(100);
        }
        const heights = new Set(samples.map((s) => s.h));
        const ys = new Set(samples.map((s) => s.y));
        const overflow = Math.max(...samples.map((s) => s.overflow));
        const tag = `${view.name} · ${name} · ${Math.round(depth * 100)} %`;
        const before = failures.length;
        if (heights.size > 1) failures.push(`${tag}: document height changed ${[...heights].join(' → ')}`);
        if (ys.size > 1) failures.push(`${tag}: scroll position moved by itself ${[...ys].join(' → ')}`);
        if (overflow > 0) failures.push(`${tag}: horizontal overflow of ${overflow} px`);
        console.log(`${failures.length > before ? 'FAIL' : 'ok  '} ${tag}: height ${[...heights].join('/')}, scrollY ${[...ys].join('/')}`);
      }
      await page.close();
    }
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error(`\nLayout stability FAILED (${failures.length}):\n - ${failures.join('\n - ')}`);
  process.exit(1);
}
console.log('\nLayout stability: every view kept its height and scroll position while animating.');
