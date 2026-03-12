import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const ARCHIVE = join(DATA, 'archive');

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function buildSearchIndex(items) {
  const index = {};
  for (const item of items) {
    const words = new Set();
    // Tokenize title and TLDR
    const text = `${item.title} ${item.tldr} ${item.source_name}`.toLowerCase();
    for (const word of text.split(/\W+/)) {
      if (word.length >= 3) words.add(word);
    }
    // Add tags
    for (const tag of item.tags) {
      words.add(tag.toLowerCase());
    }
    for (const word of words) {
      if (!index[word]) index[word] = [];
      index[word].push(item.id);
    }
  }
  return index;
}

// Main
function main() {
  const newsPath = join(DATA, 'news.json');
  if (!existsSync(newsPath)) {
    console.log('news.json not found. Run collect.js first.');
    // Create empty news.json for initial build
    const empty = { generated: new Date().toISOString(), total: 0, new_items: 0, items: [] };
    writeFileSync(newsPath, JSON.stringify(empty, null, 2));
    console.log('Created empty news.json');
  }

  const news = JSON.parse(readFileSync(newsPath, 'utf-8'));
  const items = news.items || [];
  console.log(`Building from ${items.length} items`);

  // Build search index
  const index = buildSearchIndex(items);
  const indexPath = join(DATA, 'index.json');
  writeFileSync(indexPath, JSON.stringify(index));
  console.log(`Search index: ${Object.keys(index).length} terms`);

  // Archive weekly snapshot
  if (!existsSync(ARCHIVE)) mkdirSync(ARCHIVE, { recursive: true });
  const weekStart = getWeekStart(new Date());
  const archivePath = join(ARCHIVE, `week-${weekStart}.json`);
  if (!existsSync(archivePath)) {
    writeFileSync(archivePath, JSON.stringify({
      week: weekStart,
      generated: new Date().toISOString(),
      total: items.length,
      items,
    }));
    console.log(`Archived snapshot: week-${weekStart}.json`);
  } else {
    console.log(`Archive already exists for week ${weekStart}`);
  }

  // Generate stats
  const stats = {
    generated: new Date().toISOString(),
    total_items: items.length,
    by_type: {},
    by_tag: {},
    date_range: {
      oldest: items.length ? items[items.length - 1].published : null,
      newest: items.length ? items[0].published : null,
    },
  };

  for (const item of items) {
    stats.by_type[item.type] = (stats.by_type[item.type] || 0) + 1;
    for (const tag of item.tags) {
      stats.by_tag[tag] = (stats.by_tag[tag] || 0) + 1;
    }
  }

  const statsPath = join(DATA, 'stats.json');
  writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  console.log(`Stats written to data/stats.json`);
  console.log(`  Types: ${JSON.stringify(stats.by_type)}`);

  console.log('\nBuild complete.');
}

main();
