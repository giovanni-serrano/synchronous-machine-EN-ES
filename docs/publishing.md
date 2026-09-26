# Publishing on GitHub Pages

Status: **prepared, not published.** Nothing is deployed until the author runs the workflow.

## What is ready

- `vite.config.ts` reads `PAGES_BASE`: the Pages build uses `/synchronous-machine-EN-ES/` so every asset URL is correct
  under `https://giovanni-serrano.github.io/synchronous-machine-EN-ES/`. Local builds keep `/`.
- `index.html`: title, English meta description, Open Graph / X card tags (`summary_large_image`), favicon, theme colour.
  `og:image` and `og:url` are absolute Pages URLs (social sites require absolute image URLs).
- `public/og.png` (1200 × 630): rendered from the real hook figure and fonts by `npm run og` (the `?view=og` card).
  Regenerate it whenever the hook or the title changes.
- `.github/workflows/deploy.yml`: builds (after `npm test`) with `PAGES_BASE` and deploys with the official Pages
  actions. It runs **only on manual dispatch**.

## To publish (author)

1. GitHub → repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Actions → Deploy to GitHub Pages → Run workflow** (branch `main`).
3. Check the URL above on a phone; validate the card with X's post composer (paste the URL) or any Open Graph checker.
4. Optional: to deploy on every push to `main`, add `push: { branches: [main] }` under `on:` in the workflow.

## Before each release (local checks)

```bash
npm test               # physics, i18n, layouts
npm run test:layout    # builds, then checks that no animation moves the page (phone + desktop, EN/ES, lab)
npm run perf           # builds, then measures mobile load (slow 4G, CPU ×4); budget LCP < 3 s
npm run og             # regenerate public/og.png (dev server running)
```

The browser-based checks use `playwright-core` with the locally installed Microsoft Edge (`CAPTURE_CHANNEL=chrome` to
use Chrome). Video capture (`scripts/record.mjs`) needs Playwright's ffmpeg once: `npx playwright-core install ffmpeg`.

Last measurement (checkpoint 2b, production build): FCP 1.2 s, LCP 1.2 s, hook canvas painted 1.3 s, 112 KB
transferred on the first load; the lab is a separate 18 KB (gzip) chunk loaded only with `?view=lab`.
