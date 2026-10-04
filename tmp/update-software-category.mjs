import fs from 'node:fs/promises';

const blogPath = 'app/blog.html';
const categoryPath = 'app/blog/software-development.html';
let blog = await fs.readFile(blogPath, 'utf8');
let category = await fs.readFile(categoryPath, 'utf8');
const sourceSection = blog.slice(blog.indexOf('<h2>Software Development</h2>'), blog.indexOf('<h2>AI &amp; Automation</h2>'));
const cards = sourceSection.match(/<article\b[\s\S]*?<\/article>/g);
if (cards?.length !== 4) throw new Error('Expected four Software Development cards');
const navClass = 'flex h-14 shrink-0 items-center px-8 text-base font-bold transition-colors hover:bg-black/5 hover:text-primary max-lg:px-4 max-lg:font-normal max-md:h-auto max-md:py-3 max-md:text-lg max-md:font-medium';
const links = [
  ['All', '/blog'],
  ['AI &amp; Automation', '#'],
  ['Software Development', '/blog/software-development'],
  ['SaaS &amp; Startups', '#'],
  ['Business &amp; Technology', '#'],
  ['Insights', '#'],
];
function updateMenu(html, active) {
  const menu = html.indexOf('data-blog-menu');
  const start = html.indexOf('<a', menu);
  const end = html.indexOf('</div>', start);
  if (menu < 0 || start < 0 || end < 0) throw new Error('Category menu not found');
  const content = links.map(([name, href]) => `<a
									class="${navClass}${name === active ? ' bg-black/10 text-primary' : ''}"
									href="${href}"${name === active ? '\n\t\t\t\t\t\t\t\t\taria-current="page"' : ''}
								>${name}</a>`).join('\n\t\t\t\t\t\t\t\t');
  return html.slice(0, start) + content + '\n\t\t\t\t\t\t\t' + html.slice(end);
}
blog = updateMenu(blog, 'All');
blog = blog.replace(/(<a\b[^>]*href=")#("[^>]*>\s*<span>All Software Development articles)/, '$1/blog/software-development$2');
category = updateMenu(category, 'Software Development');
category = category.replace(/(<div\s+class="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1"\s*>)[\s\S]*?(<\/div>)/,
  (_, opening, closing) => opening + '\n\t\t\t\t' + cards.join('\n\n\t\t\t\t').replaceAll('="assets/', '="../assets/') + '\n\t\t\t' + closing);
category = category.replace('<span class="font-semibold">Technology</span>', '<span class="font-semibold">Software Development</span>');
category = category.replace('<span class="text-brand-gray">Category:</span> Technology', '<span class="text-brand-gray">Category:</span> Software Development');
category = category.replace('(<span>30</span>)', '(<span>4</span>)');
category = category.replace('href="../blog.html"', 'href="/blog"');
category = category.replace('href="assets/images/icons.svg#chevron-right"', 'href="../assets/images/icons.svg#chevron-right"');
category = category.replace(/(<h1>[\s\S]*?<\/h1>)/, '$1\n\t\t<p class="text-brand-gray mt-6 max-w-3xl text-xl">Explore software development costs, compare custom and ready-made solutions, and learn how to choose the right development partner for your business.</p>');
const oldTitle = 'Kkeydos | Custom Software Development & AI Solutions';
const oldDescription = 'Kkeydos is a premier software development agency building custom web apps, mobile apps, SaaS platforms, AI chatbots, and enterprise ERP/CRM solutions.';
category = category.replaceAll(oldTitle, 'Software Development Articles &amp; Guides | KKEYDOS');
category = category.replaceAll(oldDescription, 'Explore software development guides from KKEYDOS, including SaaS costs, custom software, CRM comparisons and choosing a development company.');
category = category.replace('rel="canonical" href="https://www.kkeydos.com/"', 'rel="canonical" href="https://www.kkeydos.com/blog/software-development"');
// Keep the shared Blog navigation and footer links usable from both pages.
for (const [file, html] of [[blogPath, blog], [categoryPath, category]]) {
  const linked = html.replace(/(<a\b[^>]*href=")#("[^>]*>\s*Blog\s*<\/a>)/g, '$1/blog$2');
  await fs.writeFile(file, linked.trimEnd() + '\n');
}
console.log('Updated category content and navigation on both blog pages.');
