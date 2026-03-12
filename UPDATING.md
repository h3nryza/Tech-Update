# Updating Tech Update

## Quick Start (Manual)

```bash
cd scripts
node parse-sources.js   # Rebuild sources.json from markdown files
node collect.js          # Fetch latest news from RSS/Reddit feeds
node build.js            # Build search index and archive
```

Or all at once:
```bash
cd scripts && npm run full
```

## Slash Command

Use `/collect` as a shorthand to run the full pipeline:
```bash
cd scripts && node collect.js && node build.js
```

---

## Automated Collection

The site is designed to collect news daily at **8:00 AM SAST** (06:00 UTC).

### Option 1: GitHub Actions (Recommended)

Already configured in `.github/workflows/collect.yml`. It runs daily and commits new data automatically.

To trigger manually: Go to Actions > "Collect Tech News" > Run workflow.

### Option 2: macOS (launchctl)

Create `~/Library/LaunchAgents/com.techupdate.collect.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.techupdate.collect</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>cd /path/to/Tech-Update/scripts && /usr/local/bin/node collect.js && /usr/local/bin/node build.js</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/techupdate.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/techupdate-err.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.techupdate.collect.plist
```

### Option 3: Linux (crontab)

```bash
crontab -e
```

Add:
```
0 8 * * * cd /path/to/Tech-Update/scripts && /usr/bin/node collect.js && /usr/bin/node build.js >> /tmp/techupdate.log 2>&1
```

### Option 4: Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task: "Tech Update Collection"
3. Trigger: Daily at 08:00
4. Action: Start a program
   - Program: `node`
   - Arguments: `collect.js && node build.js`
   - Start in: `C:\path\to\Tech-Update\scripts`

---

## Adding New Sources

1. Add entries to the relevant `products/<name>/claude.md` or `topics/<name>/claude.md`
2. Update `products/consolidated.md` or `topics/consolidated.md`
3. Run `node parse-sources.js` to regenerate `data/sources.json`
4. Add RSS feed URLs to the `RSS_FEEDS` map in `scripts/parse-sources.js` if available
5. For YouTube channels, add the channel ID to `YOUTUBE_CHANNEL_IDS`

## Data Files

| File | Description |
|---|---|
| `data/sources.json` | All tracked sources with RSS URLs |
| `data/news.json` | Current news items (365-day rolling) |
| `data/index.json` | Search index |
| `data/stats.json` | Collection statistics |
| `data/archive/week-*.json` | Weekly snapshots |
