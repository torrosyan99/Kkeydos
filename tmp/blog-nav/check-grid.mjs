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
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`http://127.0.0.1:${server.address().port}/blog.html`, { waitUntil: 'networkidle' });
  const panel = page.locator('#blog-category-links');
  assert.equal(await page.locator('[data-fixed-content]').getAttribute('data-fixed'), 'false', 'Menu is not fixed on initial page load');
  const background = () => page.locator('[data-fixed-content] nav').evaluate(el => getComputedStyle(el).backgroundColor);
  assert.equal(await background(), 'rgb(246, 247, 248)', 'Initial background is light');
  await page.locator('main').evaluate(el => { el.style.paddingTop = '80.5px'; });
  await page.evaluate(() => dispatchEvent(new Event('resize')));
  await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-fixed-content]').getAttribute('data-fixed'), 'false', 'Subpixel coordinates cannot fix the menu at scroll zero');
  assert.equal(await background(), 'rgb(246, 247, 248)');
  await page.locator('main').evaluate(el => { el.style.paddingTop = ''; });
  const button = page.locator('[data-blog-trigger]');
  const height = () => panel.evaluate(el => el.getBoundingClientRect().height);
  assert.equal(await height(), 0);
  await button.click();
  const full = await height();
  assert.ok(full > 0, 'Mobile menu opens immediately');
  assert.equal(await panel.evaluate(el => getComputedStyle(el).position), 'absolute');
  assert.equal(await panel.evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  assert.equal(await panel.evaluate(el => getComputedStyle(el).display), 'flex');
  const navBottom = await page.locator('[data-fixed-content] nav').evaluate(el => el.getBoundingClientRect().bottom);
  assert.equal((await panel.boundingBox()).y, navBottom);
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  await button.click();
  assert.equal(await height(), 0);
  assert.equal(await panel.isVisible(), false);
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(350);
  assert.equal(await panel.locator('a:visible').count(), 6);
  assert.equal(await height(), 56);
  await page.reload({ waitUntil: 'networkidle' });
  const contentTop = () => page.locator('.page-container-blog.flex').evaluate(el => el.getBoundingClientRect().top + scrollY);
  const initialTop = await contentTop();
  const navigation = page.locator('[data-fixed-content]');
  const firstLink = panel.locator('a').first();
  const initialBounds = await navigation.locator('nav').boundingBox();
  await firstLink.focus();
  for (const y of [0, 1, 2, 1, 0]) {
    await page.evaluate(y => scrollTo(0, y), y);
    await page.waitForTimeout(50);
    const bounds = await navigation.locator('nav').boundingBox();
    assert.equal(bounds.x, initialBounds.x, 'Menu has no horizontal shift');
    assert.equal(bounds.width, initialBounds.width, 'Menu width stays constant');
    assert.equal(bounds.y, 101, 'Menu crosses the fixed threshold without jumping');
    assert.equal(await navigation.getAttribute('data-fixed'), String(y > 0));
    assert.equal(await contentTop(), initialTop, 'Content stays at the same document position');
  }
  await firstLink.evaluate(el => el.blur());
  for (const y of [10, 30, 250, 220, 0]) {
    await page.evaluate(y => scrollTo(0, y), y);
    await page.waitForTimeout(350);
    assert.equal(await contentTop(), initialTop, 'Placeholder preserves content position');
    assert.equal(await navigation.getAttribute('data-fixed'), String(y > 0));
    if (y === 250) assert.equal(Math.round((await navigation.boundingBox()).y), 5, 'Down scroll hides below header');
    if (y === 220) {
      assert.equal(await background(), 'rgb(0, 0, 0)', 'Fixed menu is dark after scrolling');
      const headerBottom = await page.locator('#header').evaluate(el => el.getBoundingClientRect().bottom);
      const menuTop = (await navigation.locator('nav').boundingBox()).y;
      assert.equal(menuTop - headerBottom, 20, 'Fixed menu has a 20px gap below the header');
    }
  }
  assert.equal(await background(), 'rgb(246, 247, 248)', 'Returning to the top restores the light background');
  await page.setViewportSize({ width: 390, height: 900 });
  await button.click();
  await page.evaluate(() => scrollTo(0, 250));
  await page.waitForTimeout(350);
  assert.equal(Math.round((await navigation.boundingBox()).y), 81, 'Open mobile menu stays visible');
  const reference = JSON.parse(await fs.readFile('tmp/blog-nav/reference-measurements.json', 'utf8'));
  for (const width of [1920, 1440, 1024, 834, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:${server.address().port}/blog.html`, { waitUntil: 'networkidle' });
    if (width < 768) await button.click();
    const expected = reference.find(item => item.width === width);
    const styles = await page.evaluate(() => {
      const nav = document.querySelector('[data-fixed-content] nav');
      const links = [...document.querySelectorAll('#blog-category-links a')];
      const feature = document.querySelector('.page-container-blog.flex');
      const navBox = nav.getBoundingClientRect(), featureBox = feature.getBoundingClientRect();
      return { x: navBox.x, width: navBox.width, height: navBox.height,
        gap: featureBox.top - navBox.bottom,
        featureX: featureBox.x + parseFloat(getComputedStyle(feature).paddingLeft),
        links: links.map(el => { const css = getComputedStyle(el), box = el.getBoundingClientRect();
          return { width: box.width, height: box.height, size: css.fontSize, weight: css.fontWeight,
            color: css.color, padding: css.padding, decoration: css.textDecorationLine }; }) };
    });
    assert.equal(styles.width, expected.normal.nav.width, `Reference menu width at ${width}`);
    assert.equal(styles.x, expected.normal.nav.x);
    assert.equal(styles.height, 56);
    assert.equal(styles.gap, 48);
    assert.equal(styles.featureX, styles.x);
    styles.links.forEach((link, index) => {
      const ref = expected.normal.buttons[index];
      for (const key of ['width', 'height', 'size', 'weight', 'color', 'decoration']) assert.equal(link[key], ref[key], `${key} for link ${index} at ${width}`);
    });
    await panel.locator('a').nth(1).hover();
    await page.waitForTimeout(350);
    const hover = await panel.locator('a').nth(1).evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, underline: getComputedStyle(el).textDecorationLine }));
    assert.equal(hover.bg, expected.hover.background);
    assert.equal(hover.underline, 'none');
    if (width === 1440 || width === 390) await page.screenshot({ path: `tmp/blog-nav/local-style-${width}.png` });
    console.log(`PASS reference match at ${width}px: menu width, font, link size, hover, 48px content gap`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: instant absolute mobile menu, light initial background, aria-expanded, desktop links, fixed position, 20px header gap, no layout jump.');
} finally {
  await browser.close();
  server.close();
}
