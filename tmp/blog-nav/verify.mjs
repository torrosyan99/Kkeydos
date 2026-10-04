import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from './tools/node_modules/playwright/index.mjs';

const root = path.resolve('app');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer(async (req, res) => {
  try {
    const name = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!name.startsWith(root + path.sep)) throw new Error('Invalid path');
    const data = await fs.readFile(name);
    res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const width of [1440, 1024, 768, 767, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:${server.address().port}/blog.html`, { waitUntil: 'networkidle' });
    const nav = page.locator('[data-fixed-content]');
    const menu = page.locator('[data-blog-menu]');
    const menuTrigger = menu.locator('[data-blog-trigger]');
    const search = page.locator('[data-blog-search]');
    const searchTrigger = search.locator('[data-blog-trigger]');
    const input = page.locator('#blog-search');
    assert.equal(await nav.getAttribute('data-fixed'), 'false');
    const initialTop = await page.locator('.page-container-blog').evaluate(el => el.getBoundingClientRect().top + scrollY);
    for (const [y, fixed, visible] of [[30, 'true', true], [250, 'true', false], [220, 'true', true], [0, 'false', true]]) {
      await page.evaluate(y => window.scrollTo(0, y), y);
      await page.waitForTimeout(350);
      assert.equal(await nav.getAttribute('data-fixed'), fixed);
      assert.equal(await nav.isVisible(), visible, `Scroll visibility at ${width}/${y}`);
      const top = await page.locator('.page-container-blog').evaluate(el => el.getBoundingClientRect().top + scrollY);
      assert.ok(Math.abs(top - initialTop) < 1, 'No content jump at fixation');
      if (fixed === 'true' && visible) {
        assert.equal(Math.round((await nav.boundingBox()).y), 80);
        assert.equal(await nav.locator('nav').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(0, 0, 0)');
      }
    }
    if (width < 768) {
      assert.equal(await page.locator('.blog-links').isVisible(), false);
      await menuTrigger.click();
      assert.equal(await page.locator('.blog-links').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.blog-links').isVisible(), false);
      await menuTrigger.click();
      await page.locator('h3').first().click({ position: { x: 5, y: 5 }, force: true });
      assert.equal(await menu.getAttribute('data-open'), 'false');
    }
    await searchTrigger.click();
    assert.equal(await input.evaluate(el => el === document.activeElement), true);
    await page.evaluate(() => window.scrollTo(0, 250));
    await page.waitForTimeout(350);
    assert.equal(await nav.isVisible(), true, 'Search remains visible while scrolling');
    await input.fill('AI Agent');
    await page.locator('#blog-search-form button[type=submit]').click();
    assert.equal(await page.locator('[data-blog-category]:visible').count(), 2);
    assert.equal(await search.getAttribute('data-open'), 'false');
    await page.locator('[data-blog-reset]').click();
    assert.equal(await page.locator('[data-blog-results]').isVisible(), false);
    if (width < 768) await menuTrigger.click();
    await page.locator('[data-blog-filter=talent]').click();
    assert.equal(await page.locator('[data-blog-category]:visible').count(), 0);
    assert.match(await page.locator('[data-blog-status]').textContent(), /No articles/);
    if (width < 768) await menuTrigger.click();
    await page.locator('[data-blog-filter=biz-and-tech]').click();
    assert.equal(await page.locator('[data-blog-category]:visible').count(), 1, 'CRM remains visible on tablet');
    await page.locator('[data-blog-reset]').click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `No page overflow at ${width}`);
    if (width === 1440 || width === 390) {
      if (width === 390) await menuTrigger.click();
      await page.screenshot({ path: `tmp/blog-nav/local-${width}.png` });
    }
    console.log(`PASS ${width}px: fixed position, direction, placeholder, menu, search, filters, reset, overflow`);
  }
  await page.locator('[data-blog-search] [data-blog-trigger]').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#blog-search-form').isVisible(), false);
  assert.equal(await page.locator('[data-blog-search] [data-blog-trigger]').evaluate(el => el === document.activeElement), true);
  await page.locator('[data-blog-search] [data-blog-trigger]').click();
  await page.setViewportSize({ width: 1024, height: 900 });
  assert.equal(await page.locator('#blog-search-form').isVisible(), false);
  assert.equal(await page.locator('.blog-links').isVisible(), true);
  await page.locator('[data-blog-filter=all]').click();
  await page.evaluate(() => window.scrollTo(0, 250));
  await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-fixed-content]').isVisible(), false, 'Mouse selection does not pin the bar');
  console.log('PASS Escape focus restoration, responsive reset, scroll after selecting category');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  server.close();
}
