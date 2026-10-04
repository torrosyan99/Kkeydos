import fs from 'node:fs/promises';

const file = 'app/blog.html';
let html = await fs.readFile(file, 'utf8');
const start = html.indexOf('id="blog-category-links"');
const end = html.indexOf('</nav>', start);
if (start < 0 || end < 0) throw new Error('Blog links not found');
const links = html.slice(start, end).replace(/<a\s+class="[^"]*"/g,
  '<a class="flex h-14 shrink-0 items-center px-8 text-base font-bold transition-colors hover:bg-black/5 max-lg:px-4 max-lg:font-normal max-md:h-auto max-md:py-3 max-md:text-lg max-md:font-medium"');
html = html.slice(0, start) + links + html.slice(end);
await fs.writeFile(file, html);
