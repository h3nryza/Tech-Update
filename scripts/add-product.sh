#!/bin/bash
# ============================================================
# Tech Update — Add a New Product or Topic
# Adds to config.json so the website automatically picks it up.
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../data/config.json"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Tech Update — Add Product/Topic       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Show current
echo -e "${YELLOW}Current Products:${NC}"
node -e "var c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE'));c.products.forEach(function(p){console.log('  '+p.icon+' '+p.id+' ('+p.label+')')})"
echo ""
echo -e "${YELLOW}Current Topics:${NC}"
node -e "var c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE'));c.topics.forEach(function(t){console.log('  '+t.icon+' '+t.id+' ('+t.label+')')})"
echo ""

read -p "Is this a (p)roduct or (t)opic? [p/t]: " GROUP_INPUT
if [ "$GROUP_INPUT" = "t" ] || [ "$GROUP_INPUT" = "topic" ]; then
  GROUP="topics"
else
  GROUP="products"
fi

read -p "ID (lowercase, hyphens, e.g. 'kubernetes'): " ID
read -p "Display label (e.g. 'Kubernetes'): " LABEL
read -p "Icon emoji (e.g. '⎈'): " ICON

echo ""
echo -e "${YELLOW}Adding to $GROUP:${NC}"
echo "  ID: $ID"
echo "  Label: $LABEL"
echo "  Icon: $ICON"
echo ""

node -e "
  var fs = require('fs');
  var config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));

  var group = '$GROUP';
  var exists = config[group].some(function(item) { return item.id === '$ID'; });
  if (exists) {
    console.log('Already exists in ' + group + '! Skipping.');
    process.exit(0);
  }

  config[group].push({
    id: '$ID',
    label: '$LABEL',
    icon: '$ICON',
    tags: ['$ID']
  });

  fs.writeFileSync('$CONFIG_FILE', JSON.stringify(config, null, 2));
  console.log('Added ' + '$LABEL' + ' to ' + group + '!');
  console.log('Total ' + group + ': ' + config[group].length);
"

echo ""
echo -e "${GREEN}Done!${NC} '$LABEL' added to $GROUP in config.json"
echo ""
echo "Next steps:"
echo "  1. Add sources for '$ID': ${YELLOW}./add-source.sh${NC}"
echo "  2. Collect news: ${YELLOW}node collect.js && node build.js${NC}"
echo "  3. The website will automatically show the new tab on next load!"
echo ""
