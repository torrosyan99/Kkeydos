import fs from 'node:fs/promises';

const scriptPath = 'app/assets/scripts/pages/blog.js';
let script = await fs.readFile(scriptPath, 'utf8');
const filteringStart = script.indexOf('const articles =');
if (filteringStart < 0) throw new Error('Filtering logic not found');
script = script.slice(0, filteringStart) + `form.addEventListener('submit', (event) => {
  event.preventDefault();
});
`;
await fs.writeFile(scriptPath, script);

const htmlPath = 'app/blog.html';
let html = await fs.readFile(htmlPath, 'utf8');
html = html.replace(/<button\s+class="blog-filter"\s+type="button"\s+data-blog-filter="([^"]+)"\s+aria-pressed="(?:true|false)"\s*>\s*([^<]+)\s*<\/button>/g,
  (_, category, label) => `<a class="blog-link" href="${category === 'all' ? 'blog.html' : '#'}"${category === 'all' ? ' aria-current="page"' : ''}>${label.trim()}</a>`);
html = html.replace(/\t\t<div class="page-container-narrow mb-6[^]*?\t\t<\/div>\r?\n/, '');
html = html.replace(/ data-blog-category="[^"]*"/g, '');
html = html.replace(' max-lg:data-[filtered=true]:block', '');
await fs.writeFile(htmlPath, html);
