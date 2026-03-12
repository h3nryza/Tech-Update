# Project Memory

## Context

Tech Update was created to provide a single dashboard for tracking technology news across cloud, DevOps, AI, and productivity tools. The project started with research into the best sources for each product and topic, then evolved into a full static site.

## Key Decisions

1. **GitHub Pages hosting** — No server-side rendering. Everything runs client-side.
2. **Alpine.js over React/Vue** — Minimalism. No build step, no bundler, no node_modules in the frontend.
3. **RSS/Atom for data collection** — Standard, widely supported, no API keys needed for most sources.
4. **365-day rolling window** — Keeps data manageable while providing enough historical context.
5. **Weekly archiving** — Snapshots in `data/archive/` for historical analysis.
6. **Tag-based taxonomy** — Items are tagged with product/topic names plus content type tags (#new, #update, etc.).

## Products Tracked (13)

AWS, Azure, Terraform, Cloudflare, Datadog, Claude, Gemini, OpenAI, GitHub Copilot, Slack, Obsidian, Notion, VS Code

## Topics Tracked (9)

SRE, Platform Engineering, DevOps, SecOps, Software Engineering, Automation, Orchestration, Cloud Architecture, Software Architecture

## Total Sources

386 deduplicated sources (79 with RSS feeds, 307 manual/community)
