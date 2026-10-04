import assert from 'node:assert/strict';
import fs from 'node:fs';

const articles = [
  ['custom-software-vs-off-the-shelf', 'Custom Software vs Off-the-Shelf Software: What Should Your Business Choose?', 'Software Development', 7],
  ['choose-software-development-company', 'How to Choose a Software Development Company for Your Business', 'Software Development', 7],
  ['build-business-ai-agent', 'How to Build an AI Agent for Your Business', 'AI &amp; Automation', 8],
  ['ai-agent-vs-chatbot', "AI Agent vs Chatbot: What's the Difference?", 'AI &amp; Automation', 6],
  ['saas-mvp-idea-to-launch', 'How to Build a SaaS MVP From Idea to Launch', 'SaaS &amp; Startups', 8],
  ['custom-crm-vs-hubspot-salesforce', 'Custom CRM vs HubSpot vs Salesforce: What Should Your Business Choose?', 'Software Development', 7],
];

const blog = fs.readFileSync('app/blog.html', 'utf8');
const softwareCategory = fs.readFileSync('app/blog/category/software-development.html', 'utf8');
for (const [slug, title, category, minutes] of articles) {
  const articlePath = `app/blog/${slug}.html`;
  const html = fs.readFileSync(articlePath, 'utf8');
  assert.match(html, new RegExp(`<h1>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll("'", "(?:'|&#x27;)")}</h1>`));
  assert.equal((html.match(/<h1>/g) || []).length, 1, `${slug}: one H1`);
  assert.match(html, new RegExp(`src="\.\./assets/images/pages/blog/${slug}\\.webp"`));
  assert.ok(fs.existsSync(`app/assets/images/pages/blog/${slug}.webp`), `${slug}: image exists`);
  assert.ok(html.includes(category), `${slug}: category`);
  assert.ok(html.includes('KKEYDOS Engineering'), `${slug}: author`);
  assert.ok(html.includes(`${minutes} min read`), `${slug}: reading time`);
  assert.equal((html.match(/class="faq-item"/g) || []).length, 5, `${slug}: five FAQs`);
  assert.ok(html.includes('Discuss Your Project'), `${slug}: CTA`);
  assert.ok(html.includes(`href="https://www.kkeydos.com/blog/${slug}/"`), `${slug}: canonical`);
  assert.ok(blog.includes(`href="blog/${slug}.html"`), `${slug}: listing link`);
  const card = blog.match(new RegExp(`<a class="hover:underline px-6 pt-6 pb-8" href="([^"]+)">\\s*<h5>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll("'", "(?:'|&#x27;)")}</h5>`));
  assert.equal(card?.[1], `blog/${slug}.html`, `${slug}: card link`);
  if (category === 'Software Development') assert.ok(softwareCategory.includes(`href="../${slug}.html"`), `${slug}: category link`);
}
assert.ok(blog.includes('href="blog/saas-development-cost-2026.html"'));
for (const [slug, count] of [['ai-automation', 2], ['saas-startups', 1]]) {
  const html = fs.readFileSync(`app/blog/category/${slug}.html`, 'utf8');
  assert.equal((html.match(/<article\b/g) || []).length, count, `${slug}: article count`);
  assert.ok(html.includes('absolute inset-x-0 top-0 h-56 bg-white'), `${slug}: background transition`);
  assert.ok(html.includes(`href="https://www.kkeydos.com/blog/category/${slug}/"`), `${slug}: canonical`);
  assert.ok(blog.includes(`href="/blog/category/${slug}"`), `${slug}: category link`);
}
console.log('Verified six article pages, assets, metadata, FAQs, CTAs, and listing links.');
