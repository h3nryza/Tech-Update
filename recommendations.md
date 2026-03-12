# Recommendations

## High Priority

### 1. Push Notifications / Alerts
- Add browser push notifications for #breaking-change, #zero-day, and #security items
- Slack webhook integration to post daily digest to a channel
- Email digest option via GitHub Actions + SendGrid/Mailgun (free tier)

### 2. AI-Powered Summaries
- Use Claude API to generate weekly executive summaries per product/topic
- Auto-categorize items that don't match any tag pattern
- Sentiment analysis on release notes (breaking vs. minor)

### 3. Lambda / Serverless Migration
- Move collection from GitHub Actions to AWS Lambda (see SCOPE section below)
- Deploy static site to CloudFront + S3 for faster global delivery
- Estimated cost: ~$2-5/month vs $0 on GitHub (free for public repos)

## Medium Priority

### 4. User Preferences
- Let users pick which products/topics they care about (localStorage)
- Custom dashboard view with only selected tabs
- Saved search queries / bookmarks

### 5. Diff / Change Detection
- Track version changes over time per product
- Show "Version X → Version Y" instead of just current version
- Highlight items that are new since last visit (localStorage timestamp)

### 6. Data Quality
- Add more RSS feeds for sources currently without them
- Web scraping fallback for official changelogs without RSS (Claude, OpenAI, Gemini, Notion)
- Validate all URLs periodically, remove dead sources

### 7. Analytics Dashboard
- Source health: which feeds are returning data, which are failing
- Coverage gaps: which products have few recent items
- Trending tags / topics over time

## Low Priority / Future

### 8. PWA / Offline Support
- Service worker for offline access to cached data
- App-like experience on mobile (add to home screen)

### 9. Community Features
- User-submitted sources (PR-based workflow)
- Upvote/star items
- Comments or annotations

### 10. Multi-tenant
- Support for different teams with different product lists
- Shared config.json per team

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
