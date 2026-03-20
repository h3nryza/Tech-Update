import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'TechUpdate/1.0 (https://github.com/h3nryza/Tech-Update)',
  },
  customFields: {
    item: [
      ['media:statistics', 'mediaStatistics'],
      ['media:group', 'mediaGroup'],
    ],
  },
});

function hashId(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function generateTldr(description, title, maxLen = 800) {
  if (!description && !title) return '';

  let text = (description || '').toString();

  // Strip HTML tags and entities
  text = text.replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ').trim();

  // Strip common boilerplate suffixes
  text = text
    .replace(/\s*The post .{0,100} appeared first on .{0,80}\.?$/i, '')
    .replace(/\s*Continue reading.{0,20}$/i, '')
    .replace(/\s*Read more.{0,20}$/i, '')
    .replace(/\s*Read the full article.{0,20}$/i, '')
    .replace(/\s*Click here to.{0,80}$/i, '')
    .replace(/\s*\[?\.\.\.\]?$/i, '')
    .trim();

  // If nothing useful after stripping, fall back to title
  if (!text || text.length < 20) {
    text = (title || '').trim();
  }

  // If text is just the title repeated, keep it (better than empty)
  if (!text) return '';

  // Take up to 5 sentences for a substantial summary
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length >= 2) {
    // Try 5, then 4, 3, 2 sentences — pick the longest that fits
    for (var n = Math.min(5, sentences.length); n >= 2; n--) {
      var picked = sentences.slice(0, n).join(' ').trim();
      if (picked.length <= maxLen) {
        text = picked;
        break;
      }
    }
  }

  if (text.length > maxLen) {
    // Cut at last word boundary
    text = text.slice(0, maxLen);
    const lastSpace = text.lastIndexOf(' ');
    if (lastSpace > maxLen * 0.7) text = text.slice(0, lastSpace);
    text = text.replace(/[,;:\s]+$/, '') + '...';
  }

  return text;
}

// Enhanced TLDR for GitHub releases — extracts changelog bullet points
function generateReleaseTldr(content, contentSnippet, title, maxLen = 1200) {
  // GitHub Atom feeds put full markdown release notes in content
  let raw = (content || contentSnippet || '').toString();

  // Strip HTML but preserve line breaks for structure
  raw = raw.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '');

  // Clean up markdown formatting but keep bullet points
  raw = raw
    .replace(/#{1,6}\s*/g, '')           // Remove markdown headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // Bold → plain
    .replace(/`([^`]+)`/g, '$1')         // Code → plain
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links → text only
    .replace(/^[-*]\s+/gm, '• ')         // Normalize bullet points
    .replace(/\n{3,}/g, '\n\n');          // Collapse multiple blank lines

  // Deduplicate lines (GitHub Atom feeds often duplicate content)
  const allLines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const seen = new Set();
  const lines = allLines.filter(l => {
    if (seen.has(l)) return false;
    seen.add(l);
    return true;
  });

  if (lines.length === 0) {
    return generateTldr('', title, maxLen);
  }

  // Collect meaningful lines — prioritize bullet points (changelog items)
  const bullets = lines.filter(l => l.startsWith('• ') || l.startsWith('- '));
  const nonBullets = lines.filter(l => !l.startsWith('• ') && !l.startsWith('- ') && l.length > 15);

  let result = '';

  // Start with any introductory text (first non-bullet paragraph)
  if (nonBullets.length > 0 && !lines[0].startsWith('• ')) {
    const intro = nonBullets.slice(0, 2).join(' ');
    if (intro.length > 20) {
      result = intro + ' ';
    }
  }

  // Add bullet points — these are the key changelog items
  if (bullets.length > 0) {
    const bulletText = bullets.slice(0, 15).join(' | ');
    result += bulletText;
  } else if (nonBullets.length > 0) {
    result += nonBullets.join(' ');
  }

  if (!result || result.length < 20) {
    return generateTldr(contentSnippet || content, title, maxLen);
  }

  // Trim to max length at word boundary
  if (result.length > maxLen) {
    result = result.slice(0, maxLen);
    const lastSpace = result.lastIndexOf(' ');
    if (lastSpace > maxLen * 0.7) result = result.slice(0, lastSpace);
    // Don't cut mid-bullet
    const lastPipe = result.lastIndexOf(' | ');
    if (lastPipe > maxLen * 0.5) result = result.slice(0, lastPipe);
    result = result.replace(/[,;:\s|]+$/, '') + '...';
  }

  return result.trim();
}

// Extract version string from title (e.g., "v1.14.7", "6.36.0", "Python 3.15.0a7")
function extractVersion(title) {
  if (!title) return null;
  // Go-style: go1.25.8, go1.26.1 — prefer the longest match (3-part over 2-part)
  const goMatches = [...title.matchAll(/go(\d+\.\d+(?:\.\d+)?)/gi)];
  if (goMatches.length > 0) {
    // Pick the longest version string (e.g., 1.25.8 over 1.25)
    const best = goMatches.reduce((a, b) => a[1].length >= b[1].length ? a : b);
    return best[1];
  }
  // Match patterns like v1.2.3, 1.2.3, v1.2.3-beta.1, 1.2.3a7, 1.2.3-rc1
  const match = title.match(/v?(\d+\.\d+(?:\.\d+)?(?:[-.]?(?:alpha|beta|rc|a|b|dev|pre|snapshot|M)\d*(?:[.-]\d+)?)?)/i);
  if (match) return match[1];
  // JDK-style: jdk-27+13
  const jdkMatch = title.match(/jdk[- ]?(\d+(?:\+\d+)?)/i);
  if (jdkMatch) return jdkMatch[1];
  return null;
}

// Determine release stability from version/title
function classifyStability(title, version) {
  const combined = ((title || '') + ' ' + (version || '')).toLowerCase();
  if (/alpha|\.a\d|snapshot|nightly|canary/i.test(combined)) return '#alpha';
  if (/beta|\.b\d|-b\d|preview|pre-release/i.test(combined)) return '#beta';
  if (/rc\d?|release.?candidate/i.test(combined)) return '#beta';
  // If it has a clean version number with no pre-release suffix, it's stable
  if (version && /^\d+\.\d+(\.\d+)?$/.test(version)) return '#stable';
  return '#stable';
}

function classifyTags(item, source) {
  const tags = [...(source.tags || [])];
  const title = (item.title || '').toLowerCase();
  const desc = (item.contentSnippet || item.description || '').toLowerCase();
  const combined = title + ' ' + desc;

  // Content type tags
  if (source.type === 'youtube') tags.push('#video');
  else if (source.type === 'podcast') tags.push('#podcast');
  else if (source.type === 'forum') tags.push('#social');
  else tags.push('#article');

  // Release detection — GitHub releases, changelogs, etc.
  const isRelease = /release|releases/.test(combined) || source.url.includes('/releases') || source.url.includes('/tags');
  if (isRelease) {
    tags.push('#release');
    const version = extractVersion(item.title);
    if (version) {
      tags.push(classifyStability(item.title, version));
    }
  }

  // News tags based on content
  if (/breaking|critical|urgent|emergency|deprecat/.test(combined)) tags.push('#breaking-change');
  if (/security|vulnerab|cve-|exploit|breach|patch/.test(combined)) tags.push('#security');
  if (/zero.?day|0.?day/.test(combined)) tags.push('#zero-day');
  if (/tutorial|how.to|guide|getting.started|walkthrough/.test(combined)) tags.push('#tutorial');
  if (/new feature|introducing|announcing|launch/.test(combined) && !isRelease) tags.push('#new');
  if (/update|upgrade|version|v\d|changelog/.test(combined) && !isRelease) tags.push('#update');
  if (/feature|capability|support for/.test(combined) && !tags.includes('#new')) tags.push('#feature');

  return [...new Set(tags)];
}

function determineType(source) {
  if (source.type === 'youtube') return 'video';
  if (source.type === 'podcast') return 'podcast';
  if (source.type === 'forum') return 'social';
  return 'article';
}

async function fetchRssFeed(source) {
  const items = [];
  try {
    const feed = await parser.parseURL(source.rss_url);
    for (const entry of (feed.items || []).slice(0, 30)) {
      const url = entry.link || entry.guid || '';
      if (!url) continue;

      const published = entry.pubDate || entry.isoDate || new Date().toISOString();
      const views = entry.mediaStatistics?.['@_views']
        ? parseInt(entry.mediaStatistics['@_views'], 10) : null;

      // Use enhanced TLDR for GitHub releases (they have rich content)
      const isGitHubRelease = source.rss_url && source.rss_url.includes('/releases.atom');
      let tldr;
      if (isGitHubRelease && (entry.content || entry.description)) {
        tldr = generateReleaseTldr(entry.content, entry.contentSnippet, entry.title);
      } else {
        tldr = generateTldr(
          entry.contentSnippet || entry.description || entry.content
            || (entry.mediaGroup && entry.mediaGroup['media:description'] && entry.mediaGroup['media:description'][0])
            || '',
          entry.title
        );
      }

      items.push({
        id: hashId(url),
        title: (entry.title || '').trim(),
        url,
        source: source.id,
        source_name: source.name,
        published: new Date(published).toISOString(),
        tldr,
        version: extractVersion(entry.title),
        tags: classifyTags(entry, source),
        type: determineType(source),
        views,
      });
    }
  } catch (err) {
    console.warn(`  [WARN] Failed to fetch ${source.name}: ${err.message}`);
  }
  return items;
}

async function fetchReddit(source) {
  const items = [];
  try {
    const resp = await fetch(source.rss_url, {
      headers: { 'User-Agent': 'TechUpdate/1.0' },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const posts = data?.data?.children || [];

    for (const post of posts.slice(0, 25)) {
      const p = post.data;
      if (!p || p.stickied) continue;

      const url = p.url_overridden_by_dest || `https://www.reddit.com${p.permalink}`;
      items.push({
        id: hashId(url),
        title: (p.title || '').trim(),
        url: `https://www.reddit.com${p.permalink}`,
        source: source.id,
        source_name: source.name,
        published: new Date(p.created_utc * 1000).toISOString(),
        tldr: generateTldr(p.selftext, p.title),
        version: extractVersion(p.title),
        tags: classifyTags({ title: p.title, contentSnippet: p.selftext }, source),
        type: 'social',
        views: p.score || null,
      });
    }
  } catch (err) {
    console.warn(`  [WARN] Failed to fetch ${source.name}: ${err.message}`);
  }
  return items;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main
async function main() {
  const sourcesPath = join(DATA, 'sources.json');
  if (!existsSync(sourcesPath)) {
    console.error('sources.json not found. Run parse-sources.js first.');
    process.exit(1);
  }

  const { sources } = JSON.parse(readFileSync(sourcesPath, 'utf-8'));
  const feedSources = sources.filter(s => s.rss_url);
  console.log(`Found ${feedSources.length} sources with feeds (out of ${sources.length} total)`);

  // Load existing news for dedup
  const newsPath = join(DATA, 'news.json');
  let existingItems = [];
  if (existsSync(newsPath)) {
    const existing = JSON.parse(readFileSync(newsPath, 'utf-8'));
    existingItems = existing.items || [];
  }
  const existingIds = new Set(existingItems.map(i => i.id));
  const seenIds = new Set(existingIds); // Track IDs across the entire batch

  const allItems = [];
  let fetched = 0;

  for (const source of feedSources) {
    let items;
    if (source.type === 'forum' && source.rss_url.includes('reddit.com')) {
      items = await fetchReddit(source);
    } else {
      items = await fetchRssFeed(source);
    }

    // Deduplicate against existing AND within current batch
    const newItems = items.filter(i => !seenIds.has(i.id));
    newItems.forEach(i => seenIds.add(i.id));
    allItems.push(...newItems);
    fetched++;

    if (newItems.length > 0) {
      console.log(`  [${fetched}/${feedSources.length}] ${source.name}: ${newItems.length} new items`);
    } else {
      console.log(`  [${fetched}/${feedSources.length}] ${source.name}: no new items`);
    }

    // Rate limiting: 500ms between requests
    await delay(500);
  }

  // Merge with existing, sort by date descending
  const merged = [...allItems, ...existingItems];
  merged.sort((a, b) => new Date(b.published) - new Date(a.published));

  // Prune items older than 365 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const pruned = merged.filter(i => new Date(i.published) >= cutoff);

  const output = {
    generated: new Date().toISOString(),
    total: pruned.length,
    new_items: allItems.length,
    items: pruned,
  };

  writeFileSync(newsPath, JSON.stringify(output, null, 2));
  console.log(`\nDone! ${allItems.length} new items collected.`);
  console.log(`Total items in news.json: ${pruned.length}`);
  if (merged.length > pruned.length) {
    console.log(`Pruned ${merged.length - pruned.length} items older than 365 days`);
  }
}

main().catch(err => {
  console.error('Collection failed:', err);
  process.exit(1);
});
