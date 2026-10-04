import { chromium } from './tools/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://kkeydos-test.onrender.com/blog', { waitUntil: 'networkidle' });
for (const y of [0, 30, 250, 220]) {
  await page.evaluate(y => window.scrollTo(0, y), y);
  await page.waitForTimeout(400);
  console.log(JSON.stringify(await page.locator('[data-blog-nav]').evaluate(el => {
    const css = getComputedStyle(el);
    const nav = el.querySelector('nav');
    return { y: scrollY, data: { ...el.dataset }, top: el.getBoundingClientRect().top,
      position: css.position, transform: css.transform, opacity: css.opacity,
      background: getComputedStyle(nav).backgroundColor, width: nav.getBoundingClientRect().width };
  })));
}
await page.screenshot({ path: 'tmp/blog-nav/reference-desktop.png' });
await page.locator('[data-blog-search-toggle]').click();
await page.screenshot({ path: 'tmp/blog-nav/reference-search.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator('[data-blog-menu-toggle]').click();
await page.screenshot({ path: 'tmp/blog-nav/reference-mobile.png' });
const measurements = [];
for (const width of [1920, 1440, 1024, 834, 768, 390]) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(350);
  const toggle = page.locator('[data-blog-menu-toggle]');
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  await page.mouse.move(0, 0);
  const measure = () => page.evaluate(() => {
    function info(el) {
      const css = getComputedStyle(el), box = el.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height,
        font: css.fontFamily, size: css.fontSize, weight: css.fontWeight,
        color: css.color, background: css.backgroundColor, decoration: css.textDecorationLine,
        padding: css.padding, gap: css.gap, margin: css.margin, maxWidth: css.maxWidth };
    }
    const nav = document.querySelector('[data-blog-nav] nav');
    const buttons = [...document.querySelectorAll('[data-blog-links] button')];
    const feature = document.querySelector('[data-blog-featured] > div');
    return { viewport: innerWidth, nav: info(nav), container: info(nav.parentElement),
      links: info(document.querySelector('[data-blog-links]')), buttons: buttons.map(info),
      feature: info(feature), gap: feature.getBoundingClientRect().top - nav.getBoundingClientRect().bottom };
  });
  const normal = await measure();
  await page.locator('[data-blog-filter="software-development"]').first().hover();
  await page.waitForTimeout(350);
  const hover = (await measure()).buttons[1];
  measurements.push({ width, normal, hover });
  console.log(JSON.stringify({ width, normal, hover }));
  if (width === 1440 || width === 390) await page.screenshot({ path: `tmp/blog-nav/reference-style-${width}.png` });
}
await fs.writeFile('tmp/blog-nav/reference-measurements.json', JSON.stringify(measurements, null, 2));
await browser.close();
