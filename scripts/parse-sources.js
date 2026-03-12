import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Known RSS feeds for sources (manually curated)
const RSS_FEEDS = {
  'aws.amazon.com/new': 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
  'aws.amazon.com/blogs/aws': 'https://aws.amazon.com/blogs/aws/feed/',
  'aws.amazon.com/blogs/architecture': 'https://aws.amazon.com/blogs/architecture/feed/',
  'aws.amazon.com/blogs/security': 'https://aws.amazon.com/blogs/security/feed/',
  'blog.cloudflare.com': 'https://blog.cloudflare.com/rss/',
  'www.datadoghq.com/blog': 'https://www.datadoghq.com/blog/feed/',
  'www.hashicorp.com': 'https://www.hashicorp.com/blog/feed.xml',
  'netflixtechblog.com': 'https://netflixtechblog.com/feed',
  'martinfowler.com': 'https://martinfowler.com/feed.atom',
  'thenewstack.io': 'https://thenewstack.io/feed/',
  'www.infoq.com': 'https://feed.infoq.com/',
  'devops.com': 'https://devops.com/feed/',
  'kubernetes.io/blog': 'https://kubernetes.io/feed.xml',
  'www.cncf.io/blog': 'https://www.cncf.io/blog/feed/',
  'github.blog': 'https://github.blog/feed/',
  'openai.com/news': 'https://openai.com/blog/rss.xml',
  'www.anthropic.com/news': 'https://www.anthropic.com/rss.xml',
  'code.visualstudio.com': 'https://code.visualstudio.com/feed.xml',
  'krebsonsecurity.com': 'https://krebsonsecurity.com/feed/',
  'www.darkreading.com': 'https://www.darkreading.com/rss.xml',
  'thehackernews.com': 'https://feeds.feedburner.com/TheHackersNews',
  'www.securityweek.com': 'https://www.securityweek.com/feed/',
  'hackernoon.com': 'https://hackernoon.com/feed',
  'dzone.com': 'https://feeds.dzone.com/devops',
  'sreweekly.com': 'https://sreweekly.com/feed/',
  'blog.n8n.io': 'https://blog.n8n.io/rss/',
  'www.ansible.com/blog': 'https://www.ansible.com/blog/rss.xml',
  'devopscube.com': 'https://devopscube.com/feed/',
  'learnk8s.io': 'https://learnk8s.io/rss.xml',
  'sysdig.com/blog': 'https://sysdig.com/blog/feed/',
  'www.aquasec.com/blog': 'https://blog.aquasec.com/rss.xml',
  'softwareengineeringdaily.com': 'https://softwareengineeringdaily.com/feed/podcast/',
  'risky.biz': 'https://risky.biz/feeds/risky-business/',
  'darknetdiaries.com': 'https://feeds.megaphone.fm/darknetdiaries',
  'changelog.com/shipit': 'https://changelog.com/shipit/feed',
  'changelog.com/podcast': 'https://changelog.com/podcast/feed',
  'se-radio.net': 'https://seradio.libsyn.com/rss',
  'www.lastweekinaws.com': 'https://www.lastweekinaws.com/feed/',
  'spacelift.io/blog': 'https://spacelift.io/blog/feed',
  'charity.wtf': 'https://charity.wtf/feed/',
  'highscalability.com': 'https://highscalability.com/rss/',
  'www.uipath.com/blog': 'https://www.uipath.com/blog/rss.xml',
  'humanitec.com/blog': 'https://humanitec.com/blog/rss.xml',
  'platformengineering.org/blog': 'https://platformengineering.org/blog/rss.xml',
  'www.pragmaticengineer.com': 'https://newsletter.pragmaticengineer.com/feed',
  'web.dev': 'https://web.dev/feed.xml',
};

// YouTube channel IDs for RSS
const YOUTUBE_CHANNEL_IDS = {
  '@Fireship': 'UCsBjURrPoezykLs9EqgamOA',
  '@amazonwebservices': 'UCd6MoB9NC6uYN2grvUNT-Zg',
  '@aliabdaal': 'UCoOae5nYA7VqaXzerajD0lg',
  '@TraversyMedia': 'UC29ju8bIPH5as8OGnQzwJyA',
  '@TwoMinutePapers': 'UCbfYPyITQ-7l4upoX8nvctg',
  '@TechWorldwithNana': 'UCdngmbVKX1Tgre699-XLlUA',
  '@GoogleCloudTech': 'UCWB2xnNqgPyZ8sXNfJAFxA',
  '@maboroshi': 'UCLkTl8WYHaQGIz1Czpo3HqQ',
  '@freecodecamp': 'UC8butISFwT-Wl7EV0hUK0BQ',
  '@MicrosoftAzure': 'UC0m-80FnNY2Qb7obvTL_2fA',
  '@MicrosoftDeveloper': 'UCsMica-v34Irf9KVTh6xx-g',
  '@DevOpsToolkit': 'UCfz8x0lVzJpb_dgWm9kPVrw',
  '@KodeKloud': 'UCSWj8mqQCcrcBlXPi4TBiAQ',
  '@davidbombal': 'UC7noUdfWp-ukXUlAsJnSm-Q',
  '@_JohnHammond': 'UCVeW9qkBjo3zosnqUbG7CFw',
  '@TCMSecurityAcademy': 'UC0ArlFuFYMpEewyRBzdLHiw',
  '@SANSInstitute': 'UCaVCEGJuAz3nUMPyYxQp0iA',
  '@LiveOverflow': 'UClcE-kVhqyiHCcjYwcpfj9w',
  '@DockerIo': 'UC76AVf2JkrwjxNKMuPpscHQ',
  '@ByteByteGo': 'UCZgt6AzoyjslHTC9dz0UoTw',
  '@GOTO-': 'UCs_tLP3AiwYKwdUHpltJPuA',
  '@ContinuousDelivery': 'UCCfqyGl3nq_V0bo64CjZh8g',
  '@InfoQ': 'UCkQX1tChV7Z7l1LFF4L9j_g',
  '@ACloudGuru': 'UCp8lLM2JP_1pv6E0NQ38pqw',
  '@t3dotgg': 'UCbRP3c757lWg9M-U7TyEkXA',
  '@ThePrimeagen': 'UCUyeluBRhGPCW4rPe_UvBZQ',
  '@NetNinja': 'UCW5YeuERMmlnqo4oq8vwUpg',
  '@TechWithTim': 'UC4JX40jDee_tINbkjycV4Sg',
  '@Deeplearningai': 'UCcIXc5mJsHVYTZR1maL5l9w',
  '@JeffGeerling': 'UCR-DXc1voovS8nhAvccRZhg',
  '@haboryconsulting': 'UC_ML5xP23TOWKUcc-oAE_Eg',
  '@RawkodeAcademy': 'UCrber_mFvp_FEF7D9u8PDEA',
  '@BretFisher': 'UC0NErq0RhP51iXx64ZmyVfg',
  '@NetworkChuck': 'UC9x0AN7BWHpCDHSm9NiJFJQ',
  '@cloudflare': 'UCQ3fVDBWZbGnmQBMY7_15cQ',
  '@DatadogHQ': 'UC1MYPaWDPCnb9T8FOBWMN7A',
  '@OpenAI': 'UCXZCJLdBC09xxGZ6gcdrc6A',
  '@anthropic-ai': 'UCNlhkN_w3MMuzLF4JQ4JCsQ',
  '@HashiCorp': 'UC-AdvAxaagE9W2f0webyNUQ',
  '@Notion': 'UCoSvlWS5XcwaSzIcbuJ-Ysg',
  '@code': 'UCs5Y5_7XK8HLDX0SLNwkd3w',
  '@GitHub': 'UC7c3Kb6jYCRj4JOHHZTxKsQ',
  '@cncf': 'UCvqbFHwN-nwalWPjPUKpvTA',
  '@caboradio': 'UCvqbFHwN-nwalWPjPUKpvTA',
};

// Reddit subreddits to watch
const REDDIT_SUBS = {
  'r/ChatGPT': 'https://www.reddit.com/r/ChatGPT/.json?limit=25',
  'r/aws': 'https://www.reddit.com/r/aws/.json?limit=25',
  'r/AZURE': 'https://www.reddit.com/r/AZURE/.json?limit=25',
  'r/Terraform': 'https://www.reddit.com/r/Terraform/.json?limit=25',
  'r/kubernetes': 'https://www.reddit.com/r/kubernetes/.json?limit=25',
  'r/devops': 'https://www.reddit.com/r/devops/.json?limit=25',
  'r/ObsidianMD': 'https://www.reddit.com/r/ObsidianMD/.json?limit=25',
  'r/Notion': 'https://www.reddit.com/r/Notion/.json?limit=25',
  'r/ClaudeAI': 'https://www.reddit.com/r/ClaudeAI/.json?limit=25',
  'r/GeminiAI': 'https://www.reddit.com/r/GeminiAI/.json?limit=25',
  'r/OpenAI': 'https://www.reddit.com/r/OpenAI/.json?limit=25',
  'r/vscode': 'https://www.reddit.com/r/vscode/.json?limit=25',
  'r/CloudFlare': 'https://www.reddit.com/r/CloudFlare/.json?limit=25',
  'r/programming': 'https://www.reddit.com/r/programming/.json?limit=25',
  'r/cybersecurity': 'https://www.reddit.com/r/cybersecurity/.json?limit=25',
  'r/sre': 'https://www.reddit.com/r/sre/.json?limit=25',
  'r/softwarearchitecture': 'https://www.reddit.com/r/softwarearchitecture/.json?limit=25',
  'r/GithubCopilot': 'https://www.reddit.com/r/GithubCopilot/.json?limit=25',
  'r/datadog': 'https://www.reddit.com/r/datadog/.json?limit=25',
  'r/Slack': 'https://www.reddit.com/r/Slack/.json?limit=25',
  'r/cloudcomputing': 'https://www.reddit.com/r/cloudcomputing/.json?limit=25',
};

function hashId(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function normalizeUrl(url) {
  return url.replace(/\/+$/, '').replace(/^https?:\/\/(www\.)?/, '');
}

function findRssFeed(url) {
  const normalized = normalizeUrl(url);
  for (const [pattern, feed] of Object.entries(RSS_FEEDS)) {
    if (normalized.startsWith(pattern) || normalized.includes(pattern)) {
      return feed;
    }
  }
  return null;
}

function findYoutubeRss(url) {
  for (const [handle, channelId] of Object.entries(YOUTUBE_CHANNEL_IDS)) {
    if (url.includes(handle)) {
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    }
  }
  return null;
}

function parseConsolidatedMd(filePath, category) {
  const content = readFileSync(filePath, 'utf-8');
  const sources = [];
  const lines = content.split('\n');
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim();
      continue;
    }

    // Skip non-table rows, headers, and separator lines
    if (!line.startsWith('|') || line.includes('---|') || line.includes('Source Name')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length < 5) continue;

    // Skip the # column (first cell is a number)
    const offset = /^\d+$/.test(cells[0]) ? 1 : 0;

    const name = cells[offset] || '';
    const typeOrUrl = cells[offset + 1] || '';
    let url, type, frequency, popularity, coverage;

    if (currentSection.includes('YouTube')) {
      type = 'youtube';
      url = cells[offset + 1] || '';
      frequency = cells[offset + 2] || '';
      popularity = cells[offset + 3] || '';
      coverage = cells[offset + 4] || '';
    } else if (currentSection.includes('Podcast')) {
      type = 'podcast';
      url = cells[offset + 1] || '';
      frequency = cells[offset + 2] || '';
      popularity = cells[offset + 3] || '';
      coverage = cells[offset + 4] || '';
    } else if (currentSection.includes('Newsletter')) {
      type = 'newsletter';
      url = cells[offset + 1] || '';
      frequency = cells[offset + 2] || '';
      popularity = cells[offset + 3] || '';
      coverage = cells[offset + 5] || cells[offset + 4] || '';
    } else if (currentSection.includes('Community') || currentSection.includes('Forum')) {
      type = 'forum';
      url = cells[offset + 1] || '';
      frequency = cells[offset + 2] || '';
      popularity = cells[offset + 3] || '';
      coverage = cells[offset + 4] || '';
    } else {
      // Blogs section has Type column
      type = (typeOrUrl || '').toLowerCase();
      if (type.includes('blog')) type = 'blog';
      else if (type.includes('feed') || type.includes('changelog')) type = 'blog';
      else if (type.includes('news')) type = 'blog';
      else if (type.includes('report') || type.includes('data')) type = 'blog';
      else type = 'blog';
      url = cells[offset + 2] || '';
      frequency = cells[offset + 3] || '';
      popularity = cells[offset + 4] || '';
      coverage = cells[offset + 5] || '';
    }

    if (!url || !url.startsWith('http')) continue;

    // Parse coverage into tags
    const tags = parseCoverage(coverage, category);

    // Determine popularity level
    const popLevel = popularity.toLowerCase().includes('high') ? 'high' :
                     popularity.toLowerCase().includes('medium') ? 'medium' : 'low';

    // Find RSS feed
    let rssUrl = null;
    if (type === 'youtube') {
      rssUrl = findYoutubeRss(url);
    } else if (type === 'blog' || type === 'newsletter') {
      rssUrl = findRssFeed(url);
    }

    sources.push({
      id: hashId(url),
      name: name.replace(/\*\*/g, '').trim(),
      type,
      url: url.trim(),
      rss_url: rssUrl,
      frequency: frequency.trim(),
      popularity: popLevel,
      tags,
    });
  }

  return sources;
}

function parseCoverage(coverage, category) {
  const tags = new Set();

  // Map product/topic names to tag slugs
  const tagMap = {
    'aws': 'aws', 'azure': 'azure', 'terraform': 'terraform',
    'cloudflare': 'cloudflare', 'datadog': 'datadog', 'claude': 'claude',
    'gemini': 'gemini', 'openai': 'openai', 'open ai': 'openai',
    'github copilot': 'github-copilot', 'copilot': 'github-copilot',
    'slack': 'slack', 'obsidian': 'obsidian', 'notion': 'notion',
    'vs code': 'vs-code', 'vscode': 'vs-code',
    'sre': 'sre', 'platform eng': 'platform-engineering',
    'devops': 'devops', 'secops': 'secops', 'devsecops': 'secops',
    'software eng': 'software-engineering', 'automation': 'automation',
    'orchestration': 'orchestration', 'cloud arch': 'cloud-architecture',
    'software arch': 'software-architecture',
  };

  const coverageLower = (coverage || '').toLowerCase();
  for (const [pattern, tag] of Object.entries(tagMap)) {
    if (coverageLower.includes(pattern)) {
      tags.add(tag);
    }
  }

  // Add category tag from directory structure
  if (category === 'products') {
    // Will be determined from individual files
  } else if (category === 'topics') {
    // Will be determined from individual files
  }

  if (tags.size === 0 && coverage) {
    tags.add(coverage.toLowerCase().replace(/\s+/g, '-'));
  }

  return Array.from(tags);
}

function deduplicateSources(sources) {
  const seen = new Map();
  for (const source of sources) {
    const key = normalizeUrl(source.url);
    if (seen.has(key)) {
      // Merge tags
      const existing = seen.get(key);
      const mergedTags = new Set([...existing.tags, ...source.tags]);
      existing.tags = Array.from(mergedTags);
      // Keep higher popularity
      if (source.popularity === 'high') existing.popularity = 'high';
    } else {
      seen.set(key, { ...source });
    }
  }
  return Array.from(seen.values());
}

// Main
const allSources = [];

// Parse product consolidated
const productConsolidated = join(ROOT, 'products', 'consolidated.md');
if (existsSync(productConsolidated)) {
  const sources = parseConsolidatedMd(productConsolidated, 'products');
  allSources.push(...sources);
  console.log(`Parsed ${sources.length} sources from products/consolidated.md`);
}

// Parse topic consolidated
const topicConsolidated = join(ROOT, 'topics', 'consolidated.md');
if (existsSync(topicConsolidated)) {
  const sources = parseConsolidatedMd(topicConsolidated, 'topics');
  allSources.push(...sources);
  console.log(`Parsed ${sources.length} sources from topics/consolidated.md`);
}

// Add Reddit sources
for (const [name, jsonUrl] of Object.entries(REDDIT_SUBS)) {
  const redditUrl = jsonUrl.replace('.json?limit=25', '');
  const tags = [];
  // Map subreddit to tags
  const subMap = {
    'ChatGPT': ['openai'], 'aws': ['aws'], 'AZURE': ['azure'],
    'Terraform': ['terraform'], 'kubernetes': ['orchestration'],
    'devops': ['devops'], 'ObsidianMD': ['obsidian'], 'Notion': ['notion'],
    'ClaudeAI': ['claude'], 'GeminiAI': ['gemini'], 'OpenAI': ['openai'],
    'vscode': ['vs-code'], 'CloudFlare': ['cloudflare'],
    'programming': ['software-engineering'], 'cybersecurity': ['secops'],
    'sre': ['sre'], 'softwarearchitecture': ['software-architecture'],
    'GithubCopilot': ['github-copilot'], 'datadog': ['datadog'],
    'Slack': ['slack'], 'cloudcomputing': ['cloud-architecture'],
  };
  const sub = name.replace('r/', '');
  tags.push(...(subMap[sub] || []));

  allSources.push({
    id: hashId(redditUrl),
    name,
    type: 'forum',
    url: redditUrl,
    rss_url: jsonUrl,
    frequency: 'continuous',
    popularity: 'high',
    tags,
  });
}

// Deduplicate
const deduplicated = deduplicateSources(allSources);

// Sort: high first, then medium, then low
const popOrder = { high: 0, medium: 1, low: 2 };
deduplicated.sort((a, b) => (popOrder[a.popularity] || 2) - (popOrder[b.popularity] || 2));

const output = {
  generated: new Date().toISOString(),
  total: deduplicated.length,
  sources: deduplicated,
};

const outPath = join(ROOT, 'data', 'sources.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWrote ${deduplicated.length} deduplicated sources to data/sources.json`);
console.log(`  - With RSS: ${deduplicated.filter(s => s.rss_url).length}`);
console.log(`  - Without RSS: ${deduplicated.filter(s => !s.rss_url).length}`);
