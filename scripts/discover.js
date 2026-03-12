#!/usr/bin/env node
// ============================================================
// Tech Update — AI Discovery Prompt Generator
// Generates prompts you can paste into Claude/ChatGPT to find
// new sources, blogs, channels, and topics to track.
// Also outputs a structured suggestions file for manual review.
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_DIR = path.join(__dirname, '..', 'products');
const TOPICS_DIR = path.join(__dirname, '..', 'topics');

// Load current sources
function loadSources() {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'sources.json'), 'utf8'));
    return data.sources || [];
  } catch (e) {
    return [];
  }
}

// Load current news items
function loadNews() {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news.json'), 'utf8'));
    return data.items || [];
  } catch (e) {
    return [];
  }
}

// Get all product/topic directories
function getTrackedCategories() {
  const products = [];
  const topics = [];

  try {
    fs.readdirSync(PRODUCTS_DIR).forEach(function(d) {
      if (fs.statSync(path.join(PRODUCTS_DIR, d)).isDirectory()) {
        products.push(d);
      }
    });
  } catch (e) {}

  try {
    fs.readdirSync(TOPICS_DIR).forEach(function(d) {
      if (fs.statSync(path.join(TOPICS_DIR, d)).isDirectory()) {
        topics.push(d);
      }
    });
  } catch (e) {}

  return { products, topics };
}

function generatePrompt() {
  const sources = loadSources();
  const news = loadNews();
  const categories = getTrackedCategories();

  const sourceNames = sources.map(function(s) { return s.name; }).join(', ');

  // Analyse gaps — which categories have few sources?
  const sourceCounts = {};
  sources.forEach(function(s) {
    (s.tags || []).forEach(function(t) {
      sourceCounts[t] = (sourceCounts[t] || 0) + 1;
    });
  });

  const allCats = categories.products.concat(categories.topics);
  const underserved = allCats
    .map(function(c) { return { name: c, count: sourceCounts[c] || 0 }; })
    .sort(function(a, b) { return a.count - b.count; })
    .slice(0, 5);

  // Content type gaps
  const typeCounts = {};
  sources.forEach(function(s) {
    typeCounts[s.type || 'unknown'] = (typeCounts[s.type || 'unknown'] || 0) + 1;
  });

  const now = new Date().toISOString().slice(0, 10);

  const prompt = `
=============================================================
PASTE THIS PROMPT INTO CLAUDE, CHATGPT, OR YOUR PREFERRED AI
=============================================================

I run a tech news aggregator called "Tech Update" that tracks updates across these products and topics:

**Products**: ${categories.products.join(', ')}
**Topics**: ${categories.topics.join(', ')}

I currently track ${sources.length} sources (${Object.entries(typeCounts).map(function(e) { return e[1] + ' ' + e[0]; }).join(', ')}) and have ${news.length} news items.

**My current sources include**: ${sourceNames.slice(0, 2000)}${sourceNames.length > 2000 ? '...' : ''}

**Categories with the fewest sources** (gaps I want to fill):
${underserved.map(function(u) { return '- ' + u.name + ' (' + u.count + ' sources)'; }).join('\n')}

Please help me find:

1. **New RSS/Atom blogs** I should track for each product and topic (that I'm NOT already following). Focus on:
   - Official product blogs and changelogs
   - High-quality independent blogs by practitioners
   - Developer advocates and community leaders

2. **YouTube channels** for each product/topic, especially:
   - Official product channels
   - Tutorial/deep-dive channels
   - Conference talk channels

3. **Podcasts** covering these areas (with RSS feed URLs if possible)

4. **Reddit/community sources** — subreddits, Discord servers, or forums

5. **Emerging products or topics** I should consider adding to my tracker. Think about:
   - New cloud services gaining traction
   - New DevOps/SRE tools
   - New AI coding tools
   - New productivity tools in the same category

For each source, provide:
- Name
- URL
- RSS/Atom feed URL (if available)
- Type (blog, youtube, podcast, newsletter, forum)
- Which of my products/topics it covers
- Why it's worth tracking (popularity, quality, frequency)

Format as a markdown table for easy import.

Today's date: ${now}
`;

  return prompt;
}

function generateSuggestionsTemplate() {
  const categories = getTrackedCategories();

  const template = {
    generated: new Date().toISOString(),
    instructions: 'Paste the discovery prompt into an AI assistant, then add suggested sources here for review.',
    suggested_sources: [
      {
        name: 'Example Blog',
        url: 'https://example.com',
        rss_url: 'https://example.com/feed',
        type: 'blog',
        tags: ['aws', 'devops'],
        reason: 'High quality AWS content, 2x/week',
        status: 'pending',
      },
    ],
    suggested_products: [],
    suggested_topics: [],
    current_products: categories.products,
    current_topics: categories.topics,
  };

  return template;
}

// Main
function main() {
  const action = process.argv[2] || 'prompt';

  switch (action) {
    case 'prompt': {
      const prompt = generatePrompt();
      console.log(prompt);

      // Also save to file
      const outPath = path.join(DATA_DIR, 'discovery-prompt.txt');
      fs.writeFileSync(outPath, prompt.trim());
      console.log('\n---');
      console.log('Prompt also saved to: ' + outPath);
      console.log('Copy and paste it into Claude or ChatGPT to get suggestions.');
      break;
    }

    case 'template': {
      const template = generateSuggestionsTemplate();
      const outPath = path.join(DATA_DIR, 'suggestions.json');
      fs.writeFileSync(outPath, JSON.stringify(template, null, 2));
      console.log('Suggestions template saved to: ' + outPath);
      console.log('Fill in the suggested_sources array with AI recommendations, then run:');
      console.log('  node discover.js import');
      break;
    }

    case 'import': {
      const sugPath = path.join(DATA_DIR, 'suggestions.json');
      if (!fs.existsSync(sugPath)) {
        console.log('No suggestions.json found. Run: node discover.js template');
        process.exit(1);
      }

      const suggestions = JSON.parse(fs.readFileSync(sugPath, 'utf8'));
      const approved = (suggestions.suggested_sources || []).filter(function(s) {
        return s.status === 'approved';
      });

      if (approved.length === 0) {
        console.log('No approved sources found. Mark sources with status: "approved" in suggestions.json');
        process.exit(0);
      }

      // Merge into sources.json
      const sourcesPath = path.join(DATA_DIR, 'sources.json');
      const sourcesData = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
      const existingUrls = new Set(sourcesData.sources.map(function(s) { return s.url; }));

      let added = 0;
      approved.forEach(function(s) {
        if (!existingUrls.has(s.url)) {
          const crypto = require('crypto');
          sourcesData.sources.push({
            id: crypto.createHash('sha256').update(s.url).digest('hex').slice(0, 12),
            name: s.name,
            type: s.type || 'blog',
            url: s.url,
            rss_url: s.rss_url || null,
            frequency: s.frequency || 'unknown',
            popularity: s.popularity || 'medium',
            tags: s.tags || [],
          });
          added++;
        }
      });

      fs.writeFileSync(sourcesPath, JSON.stringify(sourcesData, null, 2));
      console.log('Added ' + added + ' new sources to sources.json');
      console.log('Run: node collect.js  to fetch news from the new sources.');
      break;
    }

    case 'gaps': {
      // Quick gap analysis
      const sources = loadSources();
      const categories = getTrackedCategories();

      const counts = {};
      sources.forEach(function(s) {
        (s.tags || []).forEach(function(t) {
          counts[t] = (counts[t] || 0) + 1;
        });
      });

      console.log('\nSource Coverage Analysis');
      console.log('========================\n');

      const allCats = categories.products.concat(categories.topics);
      allCats
        .map(function(c) { return { name: c, count: counts[c] || 0 }; })
        .sort(function(a, b) { return b.count - a.count; })
        .forEach(function(c) {
          const bar = '█'.repeat(Math.min(c.count, 40));
          const pad = c.name.length < 25 ? ' '.repeat(25 - c.name.length) : ' ';
          console.log('  ' + c.name + pad + bar + ' ' + c.count);
        });

      // Type breakdown
      const typeCounts = {};
      sources.forEach(function(s) {
        typeCounts[s.type || 'unknown'] = (typeCounts[s.type || 'unknown'] || 0) + 1;
      });

      console.log('\nBy Type:');
      Object.entries(typeCounts)
        .sort(function(a, b) { return b[1] - a[1]; })
        .forEach(function(e) {
          console.log('  ' + e[0] + ': ' + e[1]);
        });

      // Sources with RSS
      const withRss = sources.filter(function(s) { return s.rss_url; }).length;
      console.log('\nRSS coverage: ' + withRss + '/' + sources.length + ' (' + Math.round(withRss / sources.length * 100) + '%)');
      break;
    }

    default:
      console.log('Usage: node discover.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  prompt    Generate an AI prompt to discover new sources (default)');
      console.log('  template  Create a suggestions.json template for manual review');
      console.log('  import    Import approved sources from suggestions.json');
      console.log('  gaps      Show source coverage gaps');
  }
}

main();
