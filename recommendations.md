# Recommendations

## High Priority

### 1. Push Notifications / Alerts
- Add browser push notifications for #breaking-change, #zero-day, and #security items
- Slack webhook integration to post daily digest to a channel
- Email digest option via GitHub Actions + SendGrid/Mailgun (free tier)
- Microsoft Teams webhook for enterprise users

### 2. AI-Powered Summaries
- Use Claude API to generate weekly executive summaries per product/topic
- Auto-categorize items that don't match any tag pattern
- Sentiment analysis on release notes (breaking vs. minor)
- Generate "What you missed this week" digest per user's subscribed tabs

### 3. Lambda / Serverless Migration
- Move collection from GitHub Actions to AWS Lambda (see SCOPE section below)
- Deploy static site to CloudFront + S3 for faster global delivery
- Estimated cost: ~$2-5/month vs $0 on GitHub (free for public repos)
- Enables real-time webhooks and multiple daily updates

### 4. Commercialise as SaaS Product
- See [COMMERCIAL.md](COMMERCIAL.md) for the full strategy
- Free tier (current functionality) + Pro tier (AI summaries, alerts, team features)
- Yoco integration for South African billing, Stripe for international
- Target: DevOps teams, engineering managers, CTOs

## Medium Priority

### 5. User Preferences & Accounts
- localStorage-based preferences for free tier (favourite tabs, hidden tabs, default date range)
- Optional user accounts for Pro tier (sync across devices, team sharing)
- Saved search queries / bookmarks
- Custom dashboard view with only selected tabs

### 6. Diff / Change Detection
- Track version changes over time per product
- Show "Version X → Version Y" instead of just current version
- Highlight items that are new since last visit (localStorage timestamp)
- Breaking change impact analysis with AI

### 7. Data Quality
- Add more RSS feeds for sources currently without them
- Web scraping fallback for official changelogs without RSS (Claude, OpenAI, Gemini, Notion)
- Validate all URLs periodically, remove dead sources
- Source health dashboard showing feed status

### 8. Analytics Dashboard
- Source health: which feeds are returning data, which are failing
- Coverage gaps: which products have few recent items
- Trending tags / topics over time
- Most shared / most viewed items

## Low Priority / Future

### 9. PWA / Offline Support
- Service worker for offline access to cached data
- App-like experience on mobile (add to home screen)
- Background sync when back online

### 10. Community Features
- User-submitted sources (PR-based workflow)
- Upvote/star items
- Comments or annotations
- Community-curated source lists

### 11. Multi-tenant
- Support for different teams with different product lists
- Shared config.json per team
- Role-based access (admin, editor, viewer)
- Team-specific notification channels

### 12. API Access
- REST API for programmatic access to news data
- Webhook subscriptions for real-time alerts
- Integration with CI/CD pipelines (e.g., block deploy if breaking change detected)
- Zapier / n8n integration

---

## Lambda Migration Scope

### What Changes
| Component | Current (GitHub) | Lambda |
|-----------|-----------------|--------|
| Collection | GitHub Actions cron | Lambda + EventBridge rule |
| Storage | Git repo (data/) | S3 bucket |
| Hosting | GitHub Pages | CloudFront + S3 |
| Cost | $0 (public repo) | ~$2-5/month |
| Cold start | N/A (runs as CI) | ~500ms (Node.js Lambda) |
| Run time | ~2-3 min (400+ feeds) | ~2-3 min (same logic) |
| Deployment | git push | SAM/CDK deploy |

### Estimated Work
- **Lambda function**: 2-4 hours (wrap collect.js in Lambda handler, S3 read/write instead of fs)
- **S3 + CloudFront**: 1-2 hours (Terraform or CDK)
- **EventBridge rule**: 30 min (cron trigger)
- **CI/CD**: 1-2 hours (GitHub Actions deploys Lambda + static site)
- **Total**: ~6-10 hours

### Cost Comparison
| | GitHub Actions | AWS Lambda |
|--|---------------|-----------|
| Compute | Free (2000 min/month) | ~$0.10/month (1 invocation/day, 3 min) |
| Storage | Free (Git LFS if needed) | ~$0.02/month (S3) |
| CDN | Free (GitHub Pages) | ~$1-3/month (CloudFront) |
| DNS | Free (github.io) | ~$0.50/month (Route 53) |
| **Total** | **$0/month** | **~$2-5/month** |

### When to Migrate
- When you need faster updates (multiple times per day)
- When you need webhooks (real-time RSS push)
- When data volume exceeds Git comfort zone (>100MB)
- When you want custom domain with full CDN control
- When Pro tier requires user accounts and API access
