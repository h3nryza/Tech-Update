import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const data = JSON.parse(readFileSync(join(ROOT, 'data', 'sources.json'), 'utf-8'));
const sources = data.sources;

// Generate markdown
let md = '# Sites Used\n\n';
md += `> Total: ${sources.length} sources\n`;
md += `> Generated: ${new Date().toISOString().slice(0, 10)}\n\n`;

const types = ['blog', 'youtube', 'podcast', 'newsletter', 'forum'];
for (const type of types) {
  const items = sources.filter(s => s.type === type);
  if (items.length === 0) continue;
  md += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s (${items.length})\n\n`;
  md += '| Name | URL | Popularity | Tags |\n|---|---|---|---|\n';
  for (const s of items) {
    md += `| ${s.name} | ${s.url} | ${s.popularity} | ${s.tags.join(', ')} |\n`;
  }
  md += '\n';
}
writeFileSync(join(ROOT, 'sites_used.md'), md);

// Generate CSV
let csv = 'Name,Type,URL,Popularity,Frequency,Tags\n';
for (const s of sources) {
  csv += `"${s.name.replace(/"/g, '""')}",`;
  csv += `${s.type},`;
  csv += `${s.url},`;
  csv += `${s.popularity},`;
  csv += `"${s.frequency}",`;
  csv += `"${s.tags.join('; ')}"\n`;
}
writeFileSync(join(ROOT, 'sites_used.csv'), csv);

console.log(`sites_used.md: ${sources.length} sources`);
console.log(`sites_used.csv: ${sources.length} rows`);
