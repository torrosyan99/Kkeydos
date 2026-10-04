import fs from 'node:fs/promises';
import prettier from '../../node_modules/prettier/index.mjs';

const path = 'app/blog.html';
let html = await fs.readFile(path, 'utf8');
const start = html.indexOf('\t<section', html.indexOf('<main'));
const end = html.indexOf('</section>', start) + '</section>'.length;
if (start < 0 || end <= start) throw new Error('Blog section not found');
const config = await prettier.resolveConfig(path);
const snippet = html.slice(start, end);
// Format the complete navigation section without reformatting the existing page.
const sectionEnd = snippet.indexOf('</section>') + '</section>'.length;
const formatted = await prettier.format(snippet.slice(0, sectionEnd), {
  ...config, parser: 'html', useTabs: true,
});
html = html.slice(0, start) + formatted.trimEnd().split('\n').map(line => `\t${line}`).join('\n')
  + snippet.slice(sectionEnd) + html.slice(end);
await fs.writeFile(path, html);
