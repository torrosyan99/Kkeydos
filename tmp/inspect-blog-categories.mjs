import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from './blog-nav/tools/node_modules/playwright/index.mjs';

const root = path.resolve('app');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`http://127.0.0.1:${server.address().port}/blog.html`, { waitUntil: 'networkidle' });
    for (const section of await page.locator('main > section[id]').all()) await section.scrollIntoViewIfNeeded();
    await page.locator('#software-development').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `tmp/blog-categories-${width}.png`, fullPage: true });
    console.log(JSON.stringify(await page.evaluate(() => ({
      width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
      categories: [...document.querySelectorAll('main > section[id]')].map(section => ({
        category: section.querySelector('h2').textContent, cards: section.querySelectorAll('article').length,
        columns: getComputedStyle(section.querySelector('.grid')).gridTemplateColumns,
      })),
      images: [...document.querySelectorAll('article > img')].map(img => ({ src: img.getAttribute('src'), width: img.naturalWidth, height: img.naturalHeight })),
    }))));
    if (width === 390) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.locator('[data-blog-trigger]').click();
      await page.locator('[data-blog-menu] a[href="#ai-automation"]').click();
      console.log('Mobile navigation:', await page.evaluate(() => ({ hash: location.hash, open: document.querySelector('[data-blog-menu]').dataset.open })));
    }
  }
  console.log('Browser errors:', errors);
} finally {
  await browser?.close();
  server.close();
}
