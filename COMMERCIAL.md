# Commercial Strategy — Tech Update

## Executive Summary

Tech Update is a tech news aggregator that tracks releases, updates, and breaking changes across 440+ sources. This document outlines the strategy to commercialise it as a SaaS product targeting DevOps teams, engineering managers, and CTOs — with billing through **Yoco** for South African customers and **Stripe** for international.

---

## Product Vision

**"Never miss a breaking change again."**

Tech Update becomes the single pane of glass for engineering teams to track every release, vulnerability, and update across their stack — with AI-powered summaries, real-time alerts, and team collaboration.

---

## Target Market

### Primary: South Africa
- DevOps teams at financial services (FNB, Standard Bank, Capitec, Discovery)
- Cloud-native startups (Luno, Yoco, OfferZen, Investec Programmable Banking)
- Managed service providers and consultancies
- Government digital teams (SITA, CSIR)

### Secondary: International
- Engineering teams at mid-market companies (50-500 engineers)
- Platform engineering teams
- CTOs and VPs of Engineering who need executive-level summaries
- Freelance DevOps consultants managing multiple client stacks

### Personas
| Persona | Pain Point | Willingness to Pay |
|---------|-----------|-------------------|
| **DevOps Lead** | Misses Terraform provider breaking changes, wastes hours debugging | High — saves 2-4hrs/week |
| **Engineering Manager** | Can't keep team informed about relevant updates | Medium — saves meeting time |
| **CTO / VP Eng** | Needs weekly summary of what changed across the stack | High — executive time is expensive |
| **Security Engineer** | Needs instant alerts on CVEs and zero-days | Very high — compliance requirement |
| **Platform Team** | Tracks 20+ tools, needs version drift visibility | High — operational necessity |

---

## Pricing Tiers

### Free Tier — "Community"
*Current functionality, always free*

- Full access to all 440+ sources
- All 33 tabs (Products, Topics, Software)
- Advanced search (AND/OR, 6 operators)
- Column filters, tag pills, date presets
- Export CSV/JSON/PDF
- Share via 9 platforms
- Daily data refresh (06:00 SAST)
- Dark/light mode
- **Limit**: Single user, no alerts, no AI summaries

### Pro Tier — R149/month (~$8 USD)
*For individual engineers and small teams*

- Everything in Free, plus:
- **AI Weekly Digest** — Claude-powered summary per product/topic, emailed every Monday
- **Real-time Alerts** — Push notifications for #breaking-change, #security, #zero-day via email, Slack, or Teams
- **Custom Source Lists** — Add your own private RSS feeds (up to 50)
- **Version Diff Tracking** — "v1.14.6 → v1.14.7" with changelog highlights
- **Saved Searches** — Bookmark complex queries, get notified on new matches
- **Priority Data Refresh** — Every 4 hours instead of daily
- **API Access** — REST API with 1,000 requests/month
- **No Ads** — Clean, distraction-free experience
- **Limit**: 1 user seat

### Team Tier — R499/month (~$27 USD)
*For engineering teams of 5-20*

- Everything in Pro, plus:
- **5 user seats** (additional seats R49/month each)
- **Team Dashboard** — Shared view with team-curated sources and tabs
- **Slack/Teams Bot** — Daily digest posted to your channel automatically
- **Custom Config** — Team-specific config.json with your stack
- **Webhook Integrations** — Push alerts to PagerDuty, Opsgenie, or custom endpoints
- **API Access** — 10,000 requests/month
- **Admin Panel** — Manage team members, notification preferences
- **Priority Support** — Email support with 24hr response

### Enterprise Tier — Custom Pricing
*For organisations with 20+ engineers*

- Everything in Team, plus:
- **Unlimited seats**
- **SSO / SAML** integration
- **Custom domain** (updates.yourcompany.com)
- **On-premise deployment** option
- **SLA** — 99.9% uptime guarantee
- **Dedicated account manager**
- **Custom AI training** — Fine-tuned summaries for your specific tech stack
- **Compliance reporting** — SOC 2, ISO 27001 evidence generation
- **API Access** — Unlimited
- **Invoice billing** (30-day net terms)

---

## Pricing Strategy

### Why These Price Points?

| Tier | ZAR | USD | EUR | GBP | Justification |
|------|-----|-----|-----|-----|---------------|
| Free | R0 | $0 | €0 | £0 | Funnel — builds trust, SEO, community |
| Pro | R149 | $8 | €7.50 | £6.50 | < cost of 1 hour of engineer time |
| Team | R499 | $27 | €25 | £21 | < cost of 1 team standup discussing "what changed" |
| Enterprise | Custom | Custom | Custom | Custom | ROI-based: prevent 1 outage = pays for a year |

### South African Context
- R149/month is accessible for SA developers (comparable to Netflix Premium)
- R499/month for teams is less than a single Jira license per seat
- Yoco has no monthly fees, charges 2.6-3.5% per transaction
- Positions well against international competitors priced in USD

---

## Payment Infrastructure

### Yoco (Primary — South Africa)

**Why Yoco:**
- South African payment gateway, understands local market
- Supports card payments, EFT, QR code payments
- No monthly fees — only per-transaction charges
- PCI DSS Level 1 compliant
- Recurring billing (subscriptions) via Yoco Subscriptions API
- Supports ZAR natively — no forex fees for SA customers

**Integration Plan:**
```
User signs up → Selects plan → Yoco Checkout → Subscription created
                                                     ↓
                              Yoco webhook → Backend confirms → Enable Pro/Team features
                                                     ↓
                              Monthly auto-debit → Yoco handles retry/dunning
```

**Yoco Technical Setup:**
1. Register merchant account at yoco.com/za (requires SA business registration)
2. Get API keys from Yoco Portal
3. Implement Yoco Inline checkout (JavaScript SDK)
4. Set up subscription plans via Yoco API:
   ```
   POST /v1/subscriptions/plans
   {
     "name": "Tech Update Pro",
     "amount": 14900,  // in cents (R149.00)
     "currency": "ZAR",
     "interval": "month",
     "intervalCount": 1
   }
   ```
5. Handle webhooks for payment success/failure/cancellation
6. Store subscription status in database (Supabase or PlanetScale)

**Yoco Fees:**
| Payment Method | Fee |
|---------------|-----|
| Card (local) | 2.6% + R0.30 |
| Card (international) | 3.5% + R0.30 |
| QR code | 1.0% |
| EFT (Capitec Pay) | R2.50 flat |

**Revenue per R149 Pro subscription:**
- Card: R149 - R4.17 = **R144.83 net**
- QR: R149 - R1.49 = **R147.51 net**

### Stripe (International)

**Why Stripe alongside Yoco:**
- Yoco only processes ZAR — international customers need USD/EUR/GBP billing
- Stripe supports 135+ currencies, 46 countries
- Stripe Billing handles subscriptions, invoicing, tax calculation
- Stripe Tax auto-calculates VAT/GST per country

**Multi-Currency Setup:**
```javascript
// Stripe price creation
const proMonthly = await stripe.prices.create({
  unit_amount: 800,  // $8.00
  currency: 'usd',
  recurring: { interval: 'month' },
  product: proProductId,
});

// Also create in EUR, GBP
const proEUR = await stripe.prices.create({
  unit_amount: 750, currency: 'eur', recurring: { interval: 'month' }, product: proProductId,
});
const proGBP = await stripe.prices.create({
  unit_amount: 650, currency: 'gbp', recurring: { interval: 'month' }, product: proProductId,
});
```

**Stripe Fees:**
| Region | Fee |
|--------|-----|
| Local (same country) | 2.9% + $0.30 |
| International | 3.9% + $0.30 |
| Currency conversion | +1% |

### Payment Router Logic

```
User selects plan
    ↓
Detect country (via IP geolocation or user selection)
    ↓
South Africa? → Yoco Checkout (ZAR)
Other?        → Stripe Checkout (USD/EUR/GBP auto-detected)
    ↓
Webhook confirms payment
    ↓
Enable subscription in database
    ↓
Monthly renewal handled by Yoco/Stripe respectively
```

---

## Tech Stack for Commercial Product

### Current (Free Tier)
- Static site on GitHub Pages
- GitHub Actions for collection
- No backend, no database, no auth

### Required for Pro/Team/Enterprise

| Component | Technology | Cost | Why |
|-----------|-----------|------|-----|
| **Frontend** | Current Alpine.js + Tailwind (enhanced) | $0 | Already built |
| **Backend API** | Node.js on Vercel or Railway | $0-20/month | Serverless, scales to zero |
| **Database** | Supabase (PostgreSQL) | $0-25/month | Free tier generous, Auth built in |
| **Auth** | Supabase Auth or Clerk | $0-25/month | Social login, SSO for enterprise |
| **Payments (ZA)** | Yoco | Transaction fees only | No monthly cost |
| **Payments (Int'l)** | Stripe | Transaction fees only | No monthly cost |
| **Email** | Resend or SendGrid | $0-20/month | Transactional + digest emails |
| **AI Summaries** | Claude API (Haiku) | ~$5-15/month | Cheapest model, great for summaries |
| **Hosting** | Vercel or Cloudflare Pages | $0-20/month | Free tier covers most usage |
| **Monitoring** | Sentry (free tier) | $0 | Error tracking |
| **Analytics** | Plausible or Umami | $0-9/month | Privacy-first, POPIA compliant |
| **Total infra** | | **~$5-90/month** | Scales with usage |

### Migration Path

**Phase 1 (Week 1-2): Auth + Payments**
- Add Supabase Auth (email + Google + GitHub login)
- Implement Yoco subscription checkout for ZA
- Implement Stripe subscription checkout for international
- Store subscription status in Supabase
- Gate Pro features behind subscription check

**Phase 2 (Week 3-4): Pro Features**
- Build AI digest pipeline (Claude Haiku for weekly summaries)
- Implement email notifications (Resend)
- Add Slack/Teams webhook integration
- Build saved searches with match notifications
- Enable custom source lists per user

**Phase 3 (Week 5-6): Team Features**
- Multi-user workspaces
- Team config management
- Admin panel for seat management
- Slack/Teams bot for team channels
- Webhook integrations (PagerDuty, Opsgenie)

**Phase 4 (Week 7-8): Polish + Launch**
- Landing page with pricing
- Documentation and onboarding flow
- Blog post / Product Hunt launch
- Reach out to SA dev community (ZATech Slack, OfferZen community)

---

## Revenue Projections

### Conservative (Year 1)

| Month | Free Users | Pro (R149) | Team (R499) | MRR (ZAR) | MRR (USD) |
|-------|-----------|-----------|-------------|-----------|-----------|
| 1 | 100 | 5 | 0 | R745 | $40 |
| 3 | 500 | 20 | 2 | R3,978 | $215 |
| 6 | 1,500 | 60 | 8 | R12,932 | $700 |
| 9 | 3,000 | 120 | 15 | R25,365 | $1,370 |
| 12 | 5,000 | 200 | 25 | R42,350 | $2,290 |

**Year 1 total: ~R250,000 (~$13,500)**

### Moderate (Year 2)

| Metric | Value |
|--------|-------|
| Free users | 15,000 |
| Pro subscribers | 600 |
| Team subscribers | 80 |
| Enterprise deals | 3 |
| **MRR** | **~R175,000 (~$9,500)** |
| **ARR** | **~R2.1M (~$114,000)** |

### Key Assumptions
- 4% free-to-Pro conversion (industry avg for dev tools: 2-5%)
- 15% Pro-to-Team upgrade rate
- 10% monthly churn on Pro, 5% on Team
- Enterprise deal avg R5,000/month
- 70% SA / 30% international split initially

---

## Go-to-Market Strategy

### Phase 1: Community Building (Month 1-3)
1. **Open source stays free** — Core aggregator remains open source on GitHub
2. **ZATech Slack** — Share in #devops, #cloud, #general channels
3. **OfferZen Community** — Blog post: "How I track 440+ tech sources in one dashboard"
4. **Reddit** — r/devops, r/sre, r/programming, r/southafrica
5. **Twitter/X** — Daily "Today in DevOps" thread linking to the dashboard
6. **Dev.to / Hashnode** — Technical blog posts about the architecture

### Phase 2: Product-Led Growth (Month 3-6)
1. **In-app upgrade prompts** — "Get AI summaries of this week's changes" CTA
2. **Share virality** — Shared links show "Powered by Tech Update" with sign-up CTA
3. **Email capture** — "Get weekly digest" email signup (free → nurture → convert)
4. **SEO** — Each product/topic gets a public page indexed by Google
5. **Referral program** — Share with 3 colleagues, get 1 month Pro free

### Phase 3: Sales-Led (Month 6-12)
1. **Target SA enterprises** — Direct outreach to DevOps leads at banks, insurers, telcos
2. **OfferZen partnership** — Sponsored content or integration
3. **Conference presence** — DevOpsDays Cape Town, ScaleConf, AWS Summit SA
4. **Case studies** — "How [Company] reduced incident response time by 40%"

---

## Legal & Compliance (South Africa)

### Business Registration
- Register as a (Pty) Ltd or sole proprietor with CIPC
- Register for VAT if turnover exceeds R1M/year (likely Year 2)
- SARS tax registration

### POPIA Compliance (Protection of Personal Information Act)
- **What you store**: Email, name, payment method (via Yoco/Stripe — you don't touch card numbers)
- **What you don't store**: No tracking cookies, no PII from news sources
- **Required**: Privacy policy, terms of service, data processing agreement for teams
- **Data location**: Supabase EU/US region — ensure cross-border transfer clause in ToS
- **Right to deletion**: Implement account deletion flow

### Consumer Protection Act (CPA)
- Clear pricing in ZAR including VAT
- 5-day cooling-off period for online subscriptions
- Easy cancellation (self-service, no phone call required)
- Refund policy: pro-rated for annual plans, no refund for monthly

### Yoco Requirements
- SA business bank account
- Valid CIPC registration or sole proprietor docs
- FICA documentation
- Physical address in South Africa

---

## Competitive Landscape

| Competitor | Price | Differentiator | Our Advantage |
|-----------|-------|---------------|---------------|
| **Feedly Pro** | $6/month | General RSS reader | We're DevOps-specific with AI tagging and version tracking |
| **DevOps Weekly** (newsletter) | Free | Email only, weekly | Real-time, searchable, filterable, exportable |
| **Changelog.com** | Free | Podcast + newsletter | We aggregate 440+ sources, not just interviews |
| **GitHub Release Radar** | Free | Monthly, GitHub only | We track RSS, blogs, changelogs too |
| **Dependabot** | Free | Code-level only | We track ecosystem news, not just your deps |
| **Snyk** | $25+/month | Security scanning | We cover all updates, not just vulnerabilities |

**Our unique position**: The only tool that combines release tracking, blog aggregation, AI summaries, and team alerts — priced for the South African market.

---

## Key Metrics to Track

| Metric | Target (Month 6) | Target (Month 12) |
|--------|-----------------|-------------------|
| Monthly Active Users (free) | 1,500 | 5,000 |
| Pro subscribers | 60 | 200 |
| Team subscribers | 8 | 25 |
| MRR | R12,932 | R42,350 |
| Free-to-Pro conversion | 4% | 4% |
| Monthly churn (Pro) | <10% | <8% |
| Monthly churn (Team) | <5% | <3% |
| NPS score | >40 | >50 |
| Time to value (sign up → first alert) | <5 min | <3 min |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| RSS feeds break or get blocked | Data quality drops | Health monitoring + scraper fallback + manual review |
| Yoco API changes | Payment disruption | Abstract payment layer, quick switch to PayFast |
| Low conversion rate | Revenue below costs | Keep infrastructure costs near zero until proven |
| Large competitor enters space | Market share loss | Focus on SA market, enterprise relationships, speed |
| POPIA violation | Legal risk, fines | Privacy-by-design, minimal data collection, annual audit |
| Claude API price increase | AI feature costs rise | Switch to local model (Ollama) or reduce frequency |

---

## Summary: What to Build Next

1. **Now**: Keep free tier growing, build community
2. **Month 1**: Add auth (Supabase) + Yoco/Stripe billing
3. **Month 2**: Launch Pro tier with AI digests and alerts
4. **Month 3**: Launch Team tier with Slack bot and admin panel
5. **Month 6**: First enterprise deal
6. **Month 12**: R42K MRR target, evaluate Series Seed funding or bootstrap

The key insight: **the free product is the marketing**. Every share, every export, every link builds awareness. The paid tiers sell themselves when an engineer realises they missed a breaking change that the alert would have caught.
