#!/bin/bash
# ============================================================
# Tech Update — Add a New Source
# Interactive script to add RSS/blog/YouTube sources
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCES_FILE="$SCRIPT_DIR/../data/sources.json"
CONFIG_FILE="$SCRIPT_DIR/../data/config.json"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Tech Update — Add New Source          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Show current products/topics
echo -e "${YELLOW}Current Products:${NC}"
node -e "var c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE'));c.products.forEach(function(p){process.stdout.write('  '+p.icon+' '+p.id+'  ')}); console.log('')"
echo ""
echo -e "${YELLOW}Current Topics:${NC}"
node -e "var c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE'));c.topics.forEach(function(t){process.stdout.write('  '+t.icon+' '+t.id+'  ')}); console.log('')"
echo ""

# Gather info
read -p "Source name (e.g. 'AWS in Plain English'): " NAME
read -p "Website URL: " URL
read -p "RSS/Atom feed URL (leave empty if none): " RSS_URL
read -p "Type (blog/youtube/podcast/newsletter/forum): " TYPE
read -p "Tags (comma-separated, e.g. aws,devops): " TAGS_INPUT
read -p "Popularity (high/medium/low) [medium]: " POPULARITY
POPULARITY=${POPULARITY:-medium}

# Generate ID
ID=$(echo -n "$URL" | shasum -a 256 | cut -c1-12)

# Format tags as JSON array
TAGS_JSON=$(echo "$TAGS_INPUT" | node -e "
  var input = require('fs').readFileSync('/dev/stdin','utf8').trim();
  var tags = input.split(',').map(function(t){return t.trim()}).filter(Boolean);
  console.log(JSON.stringify(tags));
")

# Create source object
RSS_VAL="null"
if [ -n "$RSS_URL" ]; then
  RSS_VAL="\"$RSS_URL\""
fi

echo ""
echo -e "${YELLOW}Adding source:${NC}"
echo "  Name: $NAME"
echo "  URL: $URL"
echo "  RSS: ${RSS_URL:-none}"
echo "  Type: $TYPE"
echo "  Tags: $TAGS_INPUT"
echo ""

# Add to sources.json using node
node -e "
  var fs = require('fs');
  var data = JSON.parse(fs.readFileSync('$SOURCES_FILE', 'utf8'));

  // Check for duplicate
  var exists = data.sources.some(function(s) { return s.url === '$URL'; });
  if (exists) {
    console.log('Source already exists! Skipping.');
    process.exit(0);
  }

  data.sources.push({
    id: '$ID',
    name: '$NAME',
    type: '$TYPE',
    url: '$URL',
    rss_url: $RSS_VAL,
    frequency: 'varies',
    popularity: '$POPULARITY',
    tags: $TAGS_JSON
  });
  data.total = data.sources.length;
  fs.writeFileSync('$SOURCES_FILE', JSON.stringify(data, null, 2));
  console.log('Added! Total sources: ' + data.total);
"

echo ""
echo -e "${GREEN}Done!${NC} Source added to sources.json"
echo "Run ${YELLOW}cd scripts && node collect.js${NC} to fetch news from the new source."
echo ""
