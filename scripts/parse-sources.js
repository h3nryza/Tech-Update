import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// YouTube handle → channel ID mapping (needed to build RSS URLs)
// To add a new channel: just add the entry here, then add a line in feeds.md
const YOUTUBE_CHANNELS = {
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
  '@AWSEventsChannel': 'UCdoadna9HFHsxXWhafhNvKw',
  '@AWSOnlineTechTalks': 'UCT-nPlVzJI-ccQXlxjSvJmw',
  '@StephaneMaarek': 'UCGWZY-0pONnKmF98dhZy9CQ',
  '@BeABetterDev': 'UCraiFqWi0qSIxXxXN4IHFBQ',
  '@aaborlearncloud': 'UCp8lLM2JP_1pv6E0NQ38pqw',
  '@AdamMarczakYT': 'UCdtaCs0BqoMGZxEp0OAMX0g',
  '@AzureAcademy': 'UC-MXgaFhsYU8PkqgKBc7Lzw',
  '@DevOpsDirective': 'UC4MdpjzjPuop_qWNAvR23JA',
  '@inthenextage': 'UCTbqi6o4PXjSZKlQo0eR2vA',
  '@inthetechie': 'UCFe9-V_rN9nLqVNiI8Yof3w',
  '@linkingyourthinking': 'UC85D7ERwhc1A7BDimP8cW-w',
  '@nicolevdh': 'UCDCHcqyeQgJ-jVSd6VJkbCw',
  '@zsaborviczian': 'UCC0gns4a9fhVkGkboyrBeg',
  '@JoshuaPlunkett': 'UC4fo9YNGk7BnLBP_RN-lXOQ',
  '@ThomasFrankExplains': 'UCG-KntY7aVnIGXYEE3ZSTgg',
  '@WilliamNutt': 'UCVgArwoaD4IPTzRAFzp2qGA',
  '@keepproductive': 'UCYyaQsm2HyneP9CoCidnbQ',
  '@AugustBradley': 'UCyJ4UkhBDy6VjMaS0MHaJbQ',
  '@MariePoulin': 'UCF2x6bVqs4JsBEWdjWiZ6tQ',
  '@Slack': 'UC64J_F7CL5OQQlqGFzNR3bg',
  '@JamesQQuick': 'UC-T8W79DN6PBnzomelvqJYw',
  '@DwsarkeshPatel': 'UCM8kskBzMkl_WmqjKH02YEQ',
  '@TheAIAdvantage': 'UCqGkqjkHKHj-Fp_0M_eCRCg',
  '@aiexplained-official': 'UCNJ1Ymd5yFuUPtn21xtRbbw',
  '@WesRoth': 'UC0Mz7GQx_0UfnBDAdsad4iw',
  '@TheAiGrid': 'UCpb7grAQ3eGJjKbmPZfCL_w',
  '@matthew_berman': 'UCb8Yw3Ll0Vp6iGnZj_pBSHQ',
  '@MicrosoftMechanics': 'UCJ9905MRHxwLZ2jeNQGIWxA',
  '@SRESchool': 'UC4z4qN0ekx_KXOZ9fF7D4kg',
  '@GoCloudArchitects': 'UCxfDAwRoowbbcLW_D_iHElQ',
  '@markrichards5014': 'UCVYQevENvTa3lhOqmWqcarg',
  '@alexhyett': 'UCYkBjBo0Cdv7dYjDhP9c5tQ',
  '@DevOpsJourney': 'UC4Snw5yrSDMXys31I18U3gg',
};

// ─── Tag slug mapping ────────────────────────────────────────────
// Maps header names (lowercase) to the tag IDs used in config.json
const TAG_SLUGS = {
  'aws': 'aws', 'azure': 'azure', 'terraform': 'terraform',
  'cloudflare': 'cloudflare', 'datadog': 'datadog', 'claude': 'claude',
  'gemini': 'gemini', 'openai': 'openai', 'github copilot': 'github-copilot',
  'slack': 'slack', 'obsidian': 'obsidian', 'notion': 'notion',
  'vs code': 'vs-code',
  'sre': 'sre', 'devops': 'devops', 'secops': 'secops',
  'platform engineering': 'platform-engineering',
  'software engineering': 'software-engineering',
  'automation': 'automation', 'orchestration': 'orchestration',
  'cloud architecture': 'cloud-architecture',
  'software architecture': 'software-architecture',
  // Sub-categories map to parent + extra tag
  'security': 'secops', 'architecture': 'cloud-architecture',
  'compute': 'aws', 'containers': 'aws', 'networking': 'aws',
};

function hashId(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function normalizeUrl(url) {
  return url.replace(/\/+$/, '').replace(/^https?:\/\/(www\.)?/, '');
}

function resolveYoutubeRss(url) {
  for (const [handle, channelId] of Object.entries(YOUTUBE_CHANNELS)) {
    if (url.includes(handle)) {
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    }
  }
  return null;
}

function resolveRedditJson(url) {
  // Turn https://www.reddit.com/r/aws/ into .json?limit=25
  const clean = url.replace(/\/+$/, '');
  return `${clean}/.json?limit=25`;
}

// ─── Parse feeds.md ──────────────────────────────────────────────
function parseFeedsMd(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const sources = [];

  let category = '';     // Products | Topics | Cross-cutting Sources
  let section = '';      // e.g. AWS, DevOps
  let subSection = '';   // e.g. Security (under AWS)

  for (const line of lines) {
    const trimmed = line.trim();

    // Track hierarchy from markdown headers
    if (trimmed.startsWith('## ')) {
      category = trimmed.replace(/^## /, '').trim();
      section = '';
      subSection = '';
      continue;
    }
    if (trimmed.startsWith('### ')) {
      section = trimmed.replace(/^### /, '').trim();
      subSection = '';
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      subSection = trimmed.replace(/^#### /, '').trim();
      continue;
    }

    // Parse feed lines: - type | name | url | rss_url
    if (!trimmed.startsWith('- ')) continue;
    const parts = trimmed.slice(2).split('|').map(p => p.trim());
    if (parts.length < 3) continue;

    const [type, name, url, rssUrlRaw] = parts;
    if (!url || !url.startsWith('http')) continue;

    // Build tags from current position in hierarchy
    const tags = new Set();
    const sectionSlug = TAG_SLUGS[section.toLowerCase()];
    if (sectionSlug) tags.add(sectionSlug);
    if (subSection) {
      const subSlug = TAG_SLUGS[subSection.toLowerCase()];
      if (subSlug && subSlug !== sectionSlug) tags.add(subSlug);
    }

    // Resolve RSS URL
    let rssUrl = rssUrlRaw || null;
    if (type === 'youtube') {
      rssUrl = resolveYoutubeRss(url);
    } else if (type === 'forum' && url.includes('reddit.com')) {
      rssUrl = resolveRedditJson(url);
    }

    sources.push({
      id: hashId(url),
      name,
      type,
      url: url.replace(/\/+$/, ''),
      rss_url: rssUrl,
      tags: Array.from(tags),
    });
  }

  return sources;
}

// ─── Deduplicate ─────────────────────────────────────────────────
function deduplicateSources(sources) {
  const seen = new Map();
  for (const source of sources) {
    const key = normalizeUrl(source.url);
    if (seen.has(key)) {
      const existing = seen.get(key);
      const mergedTags = new Set([...existing.tags, ...source.tags]);
      existing.tags = Array.from(mergedTags);
    } else {
      seen.set(key, { ...source });
    }
  }
  return Array.from(seen.values());
}

// ─── Main ────────────────────────────────────────────────────────
const feedsPath = join(ROOT, 'feeds.md');
if (!existsSync(feedsPath)) {
  console.error('Error: feeds.md not found at', feedsPath);
  process.exit(1);
}

const allSources = parseFeedsMd(feedsPath);
console.log(`Parsed ${allSources.length} sources from feeds.md`);

const deduplicated = deduplicateSources(allSources);

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
