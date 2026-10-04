import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { chromium } from './blog-nav/tools/node_modules/playwright/index.mjs';
const root = path.resolve('app');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = new URL(req.url, 'http://localhost').pathname;
    if (!path.extname(pathname)) pathname = pathname.replace(/\/$/, '') + '.html';
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(response.url() + ' ' + response.status()); });
try {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`http://127.0.0.1:${server.address().port}/blog/software-development`, { waitUntil: 'networkidle' });
    for (const card of await page.locator('article').all()) await card.scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `tmp/software-category-${width}.png`, fullPage: true });
    console.log(JSON.stringify(await page.evaluate(() => ({ width: innerWidth,
      heading: document.querySelector('h1').textContent.trim().replace(/\s+/g, ' '),
      cards: document.querySelectorAll('article').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      imagesLoaded: [...document.querySelectorAll('article img')].every(img => img.complete && img.naturalWidth > 0),
      menu: [...document.querySelectorAll('[data-blog-menu] a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href'), active: a.getAttribute('aria-current') })),
    }))));
    if (width < 768) await page.locator('[data-blog-trigger]').click();
    await page.locator('[data-blog-menu] a', { hasText: /^All$/ }).click();
    await page.waitForLoadState('networkidle');
    console.log('All destination:', page.url(), 'cards:', await page.locator('article').count());
    if (width < 768) await page.locator('[data-blog-trigger]').click();
    await page.locator('[data-blog-menu] a', { hasText: /^Software Development$/ }).click();
    await page.waitForLoadState('networkidle');
    console.log('Category destination:', page.url());
  }
  console.log('Errors:', errors);
} finally {
  await browser.close();
  server.close();
}
