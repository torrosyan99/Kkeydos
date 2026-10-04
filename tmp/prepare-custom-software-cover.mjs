import fs from 'node:fs/promises';
import { chromium } from './blog-nav/tools/node_modules/playwright/index.mjs';
const folder = 'app/assets/images/pages/blog/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const source = await fs.readFile(folder + 'custom-software-vs-off-the-shelf.png');
  const result = await page.evaluate(async (base64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + base64;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return { data: canvas.toDataURL('image/webp', 0.88).split(',')[1], width: canvas.width, height: canvas.height };
  }, source.toString('base64'));
  await fs.writeFile(folder + 'custom-software-vs-off-the-shelf.webp', Buffer.from(result.data, 'base64'));
  let html = await fs.readFile('app/blog.html', 'utf8');
  html = html.replace('blog/custom-software-vs-off-the-shelf.png', 'blog/custom-software-vs-off-the-shelf.webp');
  await fs.writeFile('app/blog.html', html);
  await fs.rename(folder + 'custom-software-vs-off-the-shelf.png', 'output/imagegen/custom-software-vs-off-the-shelf.png');
  console.log(JSON.stringify({ width: result.width, height: result.height, bytes: Buffer.from(result.data, 'base64').length }));
} finally {
  await browser.close();
}
