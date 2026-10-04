import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Window } from './tools/node_modules/happy-dom/lib/index.js';

const window = new Window({ settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
const document = window.document;
document.write(await fs.readFile('app/blog.html', 'utf8'));
const media = new window.EventTarget();
media.matches = true;
Object.assign(globalThis, {
  window, document, matchMedia: () => media,
  ResizeObserver: class { observe() {} },
});
const shell = document.querySelector('[data-fixed]');
const nav = document.querySelector('[data-fixed-content]');
shell.getBoundingClientRect = () => ({ top: 96 - window.scrollY });
nav.getBoundingClientRect = () => ({ height: 56 });
const scroll = y => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new window.Event('scroll'));
};
await import('../../app/assets/scripts/pages/blog.js');
assert.equal(nav.dataset.fixed, 'false');
assert.equal(shell.style.height, '56px');
scroll(20);
assert.equal(nav.dataset.fixed, 'true');
assert.equal(nav.dataset.hidden, 'false');
scroll(250);
assert.equal(nav.dataset.hidden, 'true');
assert.equal(nav.inert, true);
scroll(220);
assert.equal(nav.dataset.hidden, 'false');
assert.equal(nav.inert, false);
scroll(0);
assert.equal(nav.dataset.fixed, 'false');

const menu = document.querySelector('[data-blog-menu]');
const search = document.querySelector('[data-blog-search]');
const input = search.querySelector('input');
const trigger = document.querySelector('[data-blog-search-toggle]');
trigger.click();
assert.equal(search.hidden, false);
assert.equal(document.activeElement, input);
assert.equal(document.querySelector('[data-blog-controls]').inert, true);
scroll(300);
assert.equal(nav.dataset.hidden, 'false', 'Open search stays visible');
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
assert.equal(search.hidden, true);
assert.equal(document.activeElement, trigger);

const articles = [...document.querySelectorAll('[data-blog-category]')];
const visible = () => articles.filter(article => !article.hidden);
trigger.click();
input.value = 'AI Agent';
search.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
assert.equal(visible().length, 2);
assert.equal(search.hidden, true);
document.querySelector('[data-blog-filter="talent"]').click();
assert.equal(visible().length, 0);
assert.match(document.querySelector('[data-blog-status]').textContent, /No articles/);
document.querySelector('[data-blog-reset]').click();
assert.equal(visible().length, 6);
assert.equal(document.querySelector('[data-blog-results]').hidden, true);

media.matches = false;
media.dispatchEvent(new window.Event('change'));
const menuTrigger = document.querySelector('[data-blog-menu-trigger]');
menuTrigger.click();
assert.equal(menu.dataset.open, 'true');
assert.equal(menuTrigger.getAttribute('aria-expanded'), 'true');
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
assert.equal(menu.dataset.open, 'false');
assert.equal(document.activeElement, menuTrigger);
menuTrigger.click();
document.body.click();
assert.equal(menu.dataset.open, 'false');
trigger.click();
media.matches = true;
media.dispatchEvent(new window.Event('change'));
assert.equal(search.hidden, true);
assert.equal(document.activeElement, trigger);

const before = await fs.readFile('tmp/blog-nav/before.html', 'utf8');
const after = await fs.readFile('app/blog.html', 'utf8');
const featured = html => html.slice(html.indexOf('<div class="page-container-blog'), html.indexOf('</main>'))
  .replace(/ data-blog-category="[^"]*"/g, '');
assert.equal(featured(after), featured(before), 'Featured markup preserved apart from filter metadata');
console.log('PASS: fixed position state, placeholder height, scroll direction, focus, search, filters, empty results, reset, mobile menu, Escape, outside click, resize, preserved featured markup.');
window.happyDOM.abort();
