import fs from 'node:fs/promises';

const file = 'app/blog.html';
let html = await fs.readFile(file, 'utf8');
const start = html.indexOf('\t\t\t\t\t<div class="shrink-0 bg-inherit" data-blog-panel data-blog-search');
const end = html.indexOf('\t\t\t\t</nav>', start);
if (start < 0 || end < 0) throw new Error('Search block not found');
html = html.slice(0, start) + html.slice(end);
html = html.replace(/\s+data-blog-panels="one-active"/, '');
html = html.replace('rounded-l-lg bg-inherit" data-blog-panel data-blog-menu', 'rounded-lg bg-inherit" data-blog-menu');
await fs.writeFile(file, html);
