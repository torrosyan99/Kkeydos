import fs from 'node:fs/promises';
const file = 'app/blog.html';
let html = await fs.readFile(file, 'utf8');
html = html.replace(/(<article\b[\s\S]*?<img[\s\S]*?src="assets\/images\/pages\/([^\"]+)"[\s\S]*?width=")1600("\s+height=")900/g, (match, before, src, middle) => {
  const size = src === 'blog/saas-development-cost.webp' ? [1774, 887] : src.startsWith('about/') ? [2172, 724] : [564, 384];
  return before + size[0] + middle + size[1];
});
html = html.replaceAll('alt="Product team discussing SaaS analytics and development costs"', 'alt="SaaS platform illustration with cloud infrastructure, analytics and AI features"');
html = html.replace('alt="Business team evaluating a software development partner"', 'alt="Software development illustration with code, developer profiles and a database"');
await fs.writeFile(file, html);
