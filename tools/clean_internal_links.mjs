import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '../app');
let filesChanged = 0;
let linksChanged = 0;

function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      visit(file);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    const before = readFileSync(file, 'utf8');
    const after = before.replace(/\bhref=(["'])([^"']+)\1/g, (attribute, quote, url) => {
      if (/^(?:https?:|\/\/|mailto:|tel:)/i.test(url)) return attribute;
      const next = url.replace(/\.html(?=[?#]|$)/, '');
      if (next === url) return attribute;
      linksChanged++;
      return `href=${quote}${next.replace(/(^|\/)index(?=[?#]|$)/, '$1') || './'}${quote}`;
    });
    if (after !== before) {
      writeFileSync(file, after);
      filesChanged++;
    }
  }
}

visit(app);
console.log(`Updated ${linksChanged} links in ${filesChanged} files`);
