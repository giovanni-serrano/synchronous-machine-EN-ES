/**
 * Mobile load check on the production build: 390 × 844, CPU slowed 4×, "slow 4G" network
 * (150 ms RTT, 1.6 Mbps down, 750 kbps up). Reports FCP, LCP and when the hook's canvas first has pixels.
 *
 *   npm run perf       (builds, serves dist with `vite preview`, then measures; budget: LCP < 3 s)
 */

import { chromium } from 'playwright-core';
import { preview } from 'vite';

const server = await preview({ preview: { port: 4180, strictPort: true }, logLevel: 'warn' });
const base = server.resolvedUrls?.local[0] ?? 'http://localhost:4180/';
const browser = await chromium.launch({ channel: process.env.CAPTURE_CHANNEL ?? 'msedge', headless: true });
const results = [];
try {
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__lcp = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    const t0 = Date.now();
    await page.goto(`${base}?lang=en`, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const c = document.querySelector('.fig--hook canvas');
      if (!c || !c.width) return false;
      const px = c.getContext('2d').getImageData(Math.floor(c.width / 2), Math.floor(c.height * 0.04), 1, 1).data;
      return px[3] > 0;
    });
    const canvasMs = Date.now() - t0;
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => ({
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
      lcp: window.__lcp,
      bytes: performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0),
    }));
    results.push({ ...m, canvasMs });
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
const med = (k) => results.map((r) => r[k]).sort((a, b) => a - b)[1];
console.log(`FCP ${Math.round(med('fcp'))} ms · LCP ${Math.round(med('lcp'))} ms · hook canvas painted ${med('canvasMs')} ms · transferred ${Math.round(med('bytes') / 1024)} KB (median of 3, slow 4G, CPU ×4)`);
if (med('lcp') > 3000) {
  console.error('Budget exceeded: LCP must be < 3 s on mobile.');
  process.exit(1);
}
