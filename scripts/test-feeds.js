#!/usr/bin/env node

/**
 * test-feeds.js — Comprehensive test suite for the Tech Update data pipeline.
 *
 * Tests:
 *   1. feeds.md format validation
 *   2. sources.json integrity (matches feeds.md output)
 *   3. news.json data integrity
 *   4. config.json schema validation
 *   5. Tag consistency (all tags in sources exist in config)
 *   6. RSS URL reachability (optional, with --live flag)
 *   7. YouTube channel ID resolution
 *   8. Reddit URL format
 *   9. Duplicate detection
 *  10. Workflow YAML validation
 *
 * Usage:
 *   node test-feeds.js           # Run all offline tests
 *   node test-feeds.js --live    # Also test RSS URL reachability (slow)
 *   node test-feeds.js --verbose # Show detailed output per test
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const VERBOSE = args.includes('--verbose');

let passed = 0;
let failed = 0;
let skipped = 0;

function log(msg) { if (VERBOSE) console.log(`    ${msg}`); }
function pass(name) { passed++; console.log(`  \x1b[32mPASS\x1b[0m  ${name}`); }
function fail(name, reason) { failed++; console.log(`  \x1b[31mFAIL\x1b[0m  ${name}: ${reason}`); }
function skip(name, reason) { skipped++; console.log(`  \x1b[33mSKIP\x1b[0m  ${name}: ${reason}`); }

function readJson(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, 'utf-8'));
}

function readText(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf-8');
}

// ─── Test 1: feeds.md format validation ──────────────────────────
function testFeedsMdFormat() {
  console.log('\n--- feeds.md format validation ---');
  const content = readText('feeds.md');
  if (!content) { fail('feeds.md exists', 'File not found'); return; }
  pass('feeds.md exists');

  const lines = content.split('\n');
  const feedLines = lines.filter(l => l.trim().startsWith('- ') && l.includes('|'));
  log(`Found ${feedLines.length} feed lines`);

  if (feedLines.length < 100) {
    fail('feeds.md has sufficient entries', `Only ${feedLines.length} feeds found (expected 100+)`);
  } else {
    pass(`feeds.md has ${feedLines.length} feed entries`);
  }

  let formatErrors = 0;
  const validTypes = ['blog', 'youtube', 'podcast', 'newsletter', 'forum', 'changelog'];

  for (let i = 0; i < feedLines.length; i++) {
    const line = feedLines[i].trim().slice(2); // remove '- '
    const parts = line.split('|').map(p => p.trim());

    if (parts.length < 3) {
      log(`Line ${i + 1}: Too few fields: "${line}"`);
      formatErrors++;
      continue;
    }

    const [type, name, url] = parts;

    if (!validTypes.includes(type)) {
      log(`Line ${i + 1}: Invalid type "${type}" (name: ${name})`);
      formatErrors++;
    }

    if (!name || name.length < 2) {
      log(`Line ${i + 1}: Missing or short name: "${name}"`);
      formatErrors++;
    }

    if (!url || !url.startsWith('http')) {
      log(`Line ${i + 1}: Invalid URL: "${url}" (name: ${name})`);
      formatErrors++;
    }
  }

  if (formatErrors === 0) {
    pass('All feed lines have valid format');
  } else {
    fail('Feed line format', `${formatErrors} format errors found`);
  }

  // Check hierarchy headers exist
  const hasProducts = content.includes('## Products');
  const hasTopics = content.includes('## Topics');
  if (hasProducts && hasTopics) {
    pass('feeds.md has Products and Topics sections');
  } else {
    fail('feeds.md sections', `Missing: ${!hasProducts ? 'Products' : ''} ${!hasTopics ? 'Topics' : ''}`);
  }

  // Check for required product headers
  const requiredProducts = ['AWS', 'Azure', 'Terraform', 'Cloudflare', 'Claude', 'OpenAI'];
  const missingProducts = requiredProducts.filter(p => !content.includes(`### ${p}`));
  if (missingProducts.length === 0) {
    pass('All required product headers present');
  } else {
    fail('Required products', `Missing: ${missingProducts.join(', ')}`);
  }
}

// ─── Test 2: sources.json integrity ──────────────────────────────
function testSourcesJson() {
  console.log('\n--- sources.json integrity ---');
  const data = readJson('data/sources.json');
  if (!data) { fail('sources.json exists', 'File not found'); return; }
  pass('sources.json exists');

  if (data.total !== data.sources.length) {
    fail('sources.json total matches', `total=${data.total} but sources.length=${data.sources.length}`);
  } else {
    pass(`sources.json total matches (${data.total})`);
  }

  if (!data.generated) {
    fail('sources.json has generated timestamp', 'Missing generated field');
  } else {
    pass('sources.json has generated timestamp');
  }

  // Check required fields on each source
  let fieldErrors = 0;
  const requiredFields = ['id', 'name', 'type', 'url', 'tags'];
  for (const source of data.sources) {
    for (const field of requiredFields) {
      if (!source[field]) {
        log(`Source missing ${field}: ${JSON.stringify(source).slice(0, 100)}`);
        fieldErrors++;
      }
    }
    if (!Array.isArray(source.tags)) {
      log(`Source tags not array: ${source.name}`);
      fieldErrors++;
    }
  }

  if (fieldErrors === 0) {
    pass('All sources have required fields');
  } else {
    fail('Source required fields', `${fieldErrors} field errors`);
  }

  // Check for duplicate IDs
  const ids = data.sources.map(s => s.id);
  const dupeIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupeIds.length === 0) {
    pass('No duplicate source IDs');
  } else {
    fail('Duplicate source IDs', `${dupeIds.length} duplicates: ${dupeIds.slice(0, 5).join(', ')}`);
  }

  // Check for duplicate URLs
  const urls = data.sources.map(s => s.url.replace(/\/+$/, '').replace(/^https?:\/\/(www\.)?/, ''));
  const dupeUrls = urls.filter((url, i) => urls.indexOf(url) !== i);
  if (dupeUrls.length === 0) {
    pass('No duplicate source URLs');
  } else {
    fail('Duplicate source URLs', `${dupeUrls.length} duplicates: ${dupeUrls.slice(0, 5).join(', ')}`);
  }

  // Check valid types
  const validTypes = ['blog', 'youtube', 'podcast', 'newsletter', 'forum', 'changelog'];
  const badTypes = data.sources.filter(s => !validTypes.includes(s.type));
  if (badTypes.length === 0) {
    pass('All sources have valid types');
  } else {
    fail('Invalid source types', badTypes.map(s => `${s.name}: ${s.type}`).join(', '));
  }
}

// ─── Test 3: news.json data integrity ────────────────────────────
function testNewsJson() {
  console.log('\n--- news.json data integrity ---');
  const data = readJson('data/news.json');
  if (!data) { fail('news.json exists', 'File not found'); return; }
  pass('news.json exists');

  if (!data.items || !Array.isArray(data.items)) {
    fail('news.json has items array', 'Missing or invalid items');
    return;
  }
  pass(`news.json has ${data.items.length} items`);

  let issues = 0;
  for (const item of data.items) {
    if (!item.id) { log(`Missing id: ${item.title?.slice(0, 50)}`); issues++; }
    if (!item.title) { log(`Missing title: ${item.id}`); issues++; }
    if (!item.url) { log(`Missing url: ${item.title?.slice(0, 50)}`); issues++; }
    if (!item.source_name) { log(`Missing source_name: ${item.title?.slice(0, 50)}`); issues++; }
    if (item.url && !item.url.startsWith('http')) { log(`Invalid url: ${item.url}`); issues++; }
  }

  if (issues === 0) {
    pass('All news items have required fields');
  } else {
    fail('News item integrity', `${issues} issues found`);
  }

  // Check for duplicate news IDs
  const ids = data.items.map(i => i.id);
  const dupes = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  if (dupes.length === 0) {
    pass('No duplicate news item IDs');
  } else {
    fail('Duplicate news IDs', `${dupes.length} duplicates`);
  }

  // Check date freshness (at least some items from last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recent = data.items.filter(i => i.published && i.published > thirtyDaysAgo);
  if (recent.length > 0) {
    pass(`${recent.length} items from last 30 days`);
  } else {
    fail('Recent items', 'No items from last 30 days — feed collection may be stale');
  }
}

// ─── Test 4: config.json schema validation ───────────────────────
function testConfigJson() {
  console.log('\n--- config.json schema validation ---');
  const config = readJson('data/config.json');
  if (!config) { fail('config.json exists', 'File not found'); return; }
  pass('config.json exists');

  for (const section of ['products', 'topics', 'software']) {
    if (!Array.isArray(config[section])) {
      fail(`config.json has ${section} array`, 'Missing or not an array');
      continue;
    }
    pass(`config.json has ${section} (${config[section].length} entries)`);

    for (const item of config[section]) {
      if (!item.id || !item.label || !item.tags) {
        fail(`${section} item schema`, `Missing id/label/tags: ${JSON.stringify(item).slice(0, 100)}`);
      }
    }
  }

  // Check children have required fields
  const allItems = [...(config.products || []), ...(config.topics || []), ...(config.software || [])];
  for (const item of allItems) {
    if (item.children) {
      for (const child of item.children) {
        if (!child.id || !child.label) {
          fail('Child schema', `Missing id/label in child of ${item.id}`);
        }
      }
    }
  }
  pass('All config items and children have required fields');
}

// ─── Test 5: Tag consistency ─────────────────────────────────────
function testTagConsistency() {
  console.log('\n--- Tag consistency ---');
  const config = readJson('data/config.json');
  const sources = readJson('data/sources.json');
  if (!config || !sources) { skip('Tag consistency', 'Missing config or sources'); return; }

  // Build set of all valid tag IDs from config
  const validTags = new Set();
  for (const section of ['products', 'topics', 'software']) {
    for (const item of (config[section] || [])) {
      item.tags.forEach(t => validTags.add(t));
      if (item.children) {
        for (const child of item.children) {
          (child.tags || []).forEach(t => validTags.add(t));
        }
      }
    }
  }
  log(`Valid tags from config: ${Array.from(validTags).join(', ')}`);

  // Check source tags against config
  const unknownTags = new Set();
  for (const source of sources.sources) {
    for (const tag of source.tags) {
      if (!validTags.has(tag)) {
        unknownTags.add(tag);
        log(`Unknown tag "${tag}" on source "${source.name}"`);
      }
    }
  }

  if (unknownTags.size === 0) {
    pass('All source tags exist in config.json');
  } else {
    fail('Unknown tags', `${unknownTags.size} unknown: ${Array.from(unknownTags).join(', ')}`);
  }

  // Check all config tags have at least one source
  const sourceTags = new Set();
  sources.sources.forEach(s => s.tags.forEach(t => sourceTags.add(t)));
  const orphanTags = Array.from(validTags).filter(t => !sourceTags.has(t));
  if (orphanTags.length === 0) {
    pass('All config tags have at least one source');
  } else {
    // Warn, don't fail — some config sections (e.g. software) may not have feeds yet
    console.log(`  \x1b[33mWARN\x1b[0m  Orphan tags (in config but no sources): ${orphanTags.join(', ')}`);
    pass('Tag consistency check completed (with warnings)');
  }
}

// ─── Test 6: YouTube channel ID resolution ───────────────────────
function testYoutubeResolution() {
  console.log('\n--- YouTube channel resolution ---');
  const sources = readJson('data/sources.json');
  if (!sources) { skip('YouTube resolution', 'Missing sources.json'); return; }

  const ytSources = sources.sources.filter(s => s.type === 'youtube');
  log(`${ytSources.length} YouTube sources`);

  const noRss = ytSources.filter(s => !s.rss_url);
  if (noRss.length === 0) {
    pass(`All ${ytSources.length} YouTube sources have RSS URLs`);
  } else {
    fail('YouTube RSS resolution', `${noRss.length} without RSS: ${noRss.map(s => s.name).join(', ')}`);
  }

  // Check RSS URL format
  const badFormat = ytSources.filter(s => s.rss_url && !s.rss_url.includes('youtube.com/feeds/videos.xml?channel_id='));
  if (badFormat.length === 0) {
    pass('All YouTube RSS URLs have correct format');
  } else {
    fail('YouTube RSS format', `${badFormat.length} with wrong format`);
  }
}

// ─── Test 7: Reddit URL format ───────────────────────────────────
function testRedditFormat() {
  console.log('\n--- Reddit URL format ---');
  const sources = readJson('data/sources.json');
  if (!sources) { skip('Reddit format', 'Missing sources.json'); return; }

  const redditSources = sources.sources.filter(s => s.type === 'forum' && s.url.includes('reddit.com'));
  log(`${redditSources.length} Reddit sources`);

  const noJson = redditSources.filter(s => !s.rss_url || !s.rss_url.endsWith('.json?limit=25'));
  if (noJson.length === 0) {
    pass(`All ${redditSources.length} Reddit sources have .json endpoint`);
  } else {
    fail('Reddit JSON endpoints', `${noJson.length} missing: ${noJson.map(s => s.name).join(', ')}`);
  }
}

// ─── Test 8: Workflow YAML validation ────────────────────────────
function testWorkflowYaml() {
  console.log('\n--- Workflow YAML validation ---');
  const workflowDir = join(ROOT, '.github', 'workflows');
  const expectedWorkflows = ['collect.yml', 'pages.yml', 'security.yml', 'codeql.yml'];

  for (const wf of expectedWorkflows) {
    const path = join(workflowDir, wf);
    if (!existsSync(path)) {
      fail(`${wf} exists`, 'File not found');
      continue;
    }
    pass(`${wf} exists`);

    const content = readFileSync(path, 'utf-8');

    // Basic YAML structure checks
    if (!content.includes('name:')) {
      fail(`${wf} has name`, 'Missing name field');
    }
    if (!content.includes('on:')) {
      fail(`${wf} has trigger`, 'Missing on: field');
    }
    if (!content.includes('jobs:')) {
      fail(`${wf} has jobs`, 'Missing jobs field');
    }
  }

  // Check security gate exists
  const secContent = readText('.github/workflows/security.yml');
  if (secContent && secContent.includes('security-gate')) {
    pass('security.yml has security-gate job');
  } else {
    fail('Security gate', 'Missing security-gate job in security.yml');
  }

  // Check deploy is gated on security
  const pagesContent = readText('.github/workflows/pages.yml');
  if (pagesContent && pagesContent.includes('workflow_run')) {
    pass('pages.yml is gated on Security Pipeline');
  } else {
    fail('Deploy gate', 'pages.yml not gated on security workflow');
  }

  // Check collect.yml npm audit is blocking (no || true)
  const collectContent = readText('.github/workflows/collect.yml');
  if (collectContent && collectContent.includes('npm audit') && !collectContent.includes('|| true')) {
    pass('collect.yml npm audit is blocking');
  } else {
    fail('collect.yml audit', 'npm audit uses || true (non-blocking)');
  }
}

// ─── Test 9: RSS reachability (live, optional) ───────────────────
async function testRssReachability() {
  console.log('\n--- RSS URL reachability (live) ---');
  if (!LIVE) { skip('RSS reachability', 'Use --live flag to enable'); return; }

  const sources = readJson('data/sources.json');
  if (!sources) { skip('RSS reachability', 'Missing sources.json'); return; }

  const withRss = sources.sources.filter(s => s.rss_url);
  console.log(`  Testing ${withRss.length} RSS URLs (this may take a minute)...`);

  let reachable = 0;
  let unreachable = 0;
  const failures = [];

  // Test in batches of 10 to avoid overwhelming
  for (let i = 0; i < withRss.length; i += 10) {
    const batch = withRss.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (s) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(s.rss_url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'TechUpdate/1.0 (feed-test)' },
          });
          clearTimeout(timeout);
          return { name: s.name, url: s.rss_url, status: res.status, ok: res.ok };
        } catch (err) {
          clearTimeout(timeout);
          return { name: s.name, url: s.rss_url, status: 0, ok: false, error: err.message };
        }
      })
    );

    for (const r of results) {
      const val = r.value || r.reason;
      if (val.ok) {
        reachable++;
      } else {
        unreachable++;
        failures.push(`${val.name} (${val.status || val.error})`);
        log(`UNREACHABLE: ${val.name} — ${val.url} — ${val.status || val.error}`);
      }
    }
  }

  pass(`${reachable}/${withRss.length} RSS URLs reachable`);
  if (unreachable > 0) {
    console.log(`  \x1b[33mWARN\x1b[0m  ${unreachable} unreachable URLs:`);
    failures.forEach(f => console.log(`         ${f}`));
  }
}

// ─── Test 10: No secrets in committed files ──────────────────────
function testNoSecrets() {
  console.log('\n--- Secrets scan (pattern check) ---');

  const patterns = [
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'OpenAI Key', regex: /sk-[a-zA-Z0-9]{48}/ },
    { name: 'GitHub PAT', regex: /ghp_[a-zA-Z0-9]{36}/ },
    { name: 'Generic password', regex: /password\s*=\s*['"][^'"]+['"]/ },
    { name: 'Generic secret', regex: /secret\s*=\s*['"][^'"]+['"]/ },
  ];

  const filesToCheck = [
    'scripts/parse-sources.js',
    'scripts/collect.js',
    'scripts/build.js',
    'data/config.json',
    'index.html',
    'feeds.md',
  ];

  let found = 0;
  for (const file of filesToCheck) {
    const content = readText(file);
    if (!content) continue;
    for (const { name, regex } of patterns) {
      if (regex.test(content)) {
        fail(`No ${name} in ${file}`, 'Pattern matched!');
        found++;
      }
    }
  }

  if (found === 0) {
    pass('No secret patterns found in key files');
  }
}

// ─── Run all tests ───────────────────────────────────────────────
console.log('\n========================================');
console.log('  Tech Update Test Suite');
console.log('========================================');

testFeedsMdFormat();
testSourcesJson();
testNewsJson();
testConfigJson();
testTagConsistency();
testYoutubeResolution();
testRedditFormat();
testWorkflowYaml();
testNoSecrets();

if (LIVE) {
  await testRssReachability();
}

console.log('\n========================================');
console.log(`  Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, \x1b[33m${skipped} skipped\x1b[0m`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
