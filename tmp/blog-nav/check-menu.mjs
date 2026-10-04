import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from './tools/node_modules/playwright/index.mjs';

const root = path.resolve('app');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
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
try {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:${server.address().port}/blog.html`, { waitUntil: 'networkidle' });
    const navigation = page.locator('[data-fixed-content]');
    const searchTrigger = page.locator('[data-blog-search] [data-blog-trigger]');
    const input = page.locator('#blog-search');
    for (const [y, visible] of [[30, true], [250, false], [220, true]]) {
      await page.evaluate(y => scrollTo(0, y), y);
      await page.waitForTimeout(350);
      assert.equal(await navigation.getAttribute('data-fixed'), 'true');
      assert.equal(await navigation.isVisible(), visible);
    }
    const contentBefore = await page.locator('.page-container-blog').innerHTML();
    await searchTrigger.click();
    assert.equal(await input.isVisible(), true);
    if (width >= 768) {
      assert.equal(await page.locator('.blog-links').isVisible(), true);
      assert.equal(await page.locator('.blog-link:visible').count(), 6);
      const first = await page.locator('.blog-link').first().boundingBox();
      const form = await page.locator('#blog-search-form').boundingBox();
      assert.ok(first.x + first.width <= form.x, 'Search does not cover the start of the menu');
    }
    await input.fill('AI Agent');
    await page.locator('#blog-search-form button[type=submit]').click();
    assert.equal(await page.locator('.page-container-blog').innerHTML(), contentBefore, 'No article filtering');
    await page.screenshot({ path: `tmp/blog-nav/menu-search-${width}.png` });
    await page.keyboard.press('Escape');
    assert.equal(await input.isVisible(), false);
    if (width < 768) {
      await page.locator('[data-blog-menu] [data-blog-trigger]').click();
      assert.equal(await page.locator('.blog-link:visible').count(), 6);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log(`PASS ${width}px: fixation, scroll direction, visible menu with search, no filtering, close, mobile`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  server.close();
}
