# Lambda: Daily News Collection

AWS Lambda function that replaces the GitHub Actions daily cron job, saving build minutes.

## Architecture

```
EventBridge (04:00 UTC daily)
    |
    v
Lambda (Node.js 20, 512MB, 10min timeout)
    |
    ├── Downloads feeds.md + data/ from GitHub API
    ├── Runs parse-sources.js → collect.js → build.js
    ├── Runs test-feeds.js (35-point validation)
    └── Commits updated data/ files back via GitHub Git Data API
```

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) (`brew install aws-sam-cli`)
- GitHub Personal Access Token with `repo` scope

## Deploy

```bash
# First-time (guided — prompts for GitHub token, region, etc.)
cd lambda
./deploy.sh

# Subsequent deploys (non-interactive)
./deploy.sh --no-confirm
```

The guided deploy will ask for:
- **GitHubToken**: Your GitHub PAT (stored as a CloudFormation parameter, not in code)
- **GitHubOwner**: `h3nryza`
- **GitHubRepo**: `Tech-Update`
- **GitHubBranch**: `main`
- **Schedule**: `cron(0 4 * * ? *)` (04:00 UTC daily)

## Test

```bash
# Invoke manually
aws lambda invoke --function-name tech-update-collect /dev/stdout

# View logs
sam logs --name CollectFunction --stack-name tech-update-collector --tail
```

## What it does

1. **Downloads** `feeds.md`, `data/sources.json`, `data/news.json`, `data/config.json` from the repo via GitHub API
2. **Runs** the same pipeline as GitHub Actions:
   - `parse-sources.js` — parses feeds.md into sources.json
   - `collect.js` — fetches all RSS/YouTube/Reddit feeds
   - `build.js` — builds search index and stats
   - `test-feeds.js` — validates everything (35 checks)
3. **Commits** updated data files back to the repo via GitHub's Git Data API (atomic multi-file commit)

## Cost

- **Lambda**: ~5 min execution, 512MB = ~$0.004/day = **~$0.12/month**
- **EventBridge**: Free (under free tier)
- **CloudWatch Logs**: 30-day retention, minimal

vs GitHub Actions: ~8 min/day of ubuntu-latest = **~240 min/month** of build minutes saved.

## Monitoring

- **CloudWatch Alarm**: Fires if the Lambda errors (checks daily)
- **CloudWatch Logs**: 30-day retention
- **Commit history**: Lambda commits show `(lambda)` suffix

## GitHub Actions Fallback

The `collect.yml` workflow is kept but with the cron schedule removed. You can trigger it manually from the Actions tab as a fallback if Lambda is down:

```
Actions → Collect Tech News (Manual / Fallback) → Run workflow
```

## Files

```
lambda/
├── handler.js      Lambda entry point (orchestrates pipeline)
├── package.json    Lambda dependencies
├── template.yaml   SAM/CloudFormation template
├── build.sh        Packages scripts + deps into dist/
├── deploy.sh       Validates + deploys via SAM
└── README.md       This file
```
