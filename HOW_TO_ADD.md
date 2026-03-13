# Tech Update -- How to Add Things

A practical guide for adding sources, products, sub-tabs, and sections to the Tech Update dashboard.

---

## Adding a New SOURCE to an Existing Product or Topic

A "source" is an RSS feed, blog, YouTube channel, or newsletter that the system checks for new content. This is the most common change you will make.

### Option A: Use the Interactive Script (Easiest)

1. Open a terminal and navigate to the `scripts/` folder:
   ```
   cd scripts
   ```

2. Run the helper script:
   ```
   ./add-source.sh
   ```

3. The script will show you all current products and topics, then ask you for:
   - **Source name** -- a human-readable name (e.g., "AWS in Plain English")
   - **Website URL** -- the main URL of the blog/channel
   - **RSS/Atom feed URL** -- the feed URL if available (leave blank if none)
   - **Type** -- one of: `blog`, `youtube`, `podcast`, `newsletter`, `forum`
   - **Tags** -- comma-separated product/topic IDs that this source belongs to (e.g., `aws,devops`)
   - **Popularity** -- `high`, `medium`, or `low` (defaults to medium)

4. The script adds the source to `data/sources.json` automatically.

5. To test it immediately, run:
   ```
   node collect.js
   ```

6. Otherwise, the daily pipeline picks it up automatically at 06:00 SAST.

### Option B: Edit sources.json Directly

1. Open `data/sources.json` in a text editor.

2. Find the `"sources"` array and add a new entry at the end (before the closing `]`):
   ```json
   {
     "id": "abc123def456",
     "name": "My New Blog",
     "type": "blog",
     "url": "https://example.com",
     "rss_url": "https://example.com/feed.xml",
     "frequency": "varies",
     "popularity": "medium",
     "tags": ["aws", "devops"]
   }
   ```

3. Update the `"total"` field at the top of the file to match the new count.

4. For the `id`, you can generate one by running:
   ```
   echo -n "https://example.com" | shasum -a 256 | cut -c1-12
   ```
   Or just use any unique 12-character string.

5. The **tags** field is what connects this source to tabs on the website. Use the `id` values from `data/config.json`. For example:
   - `["aws"]` -- appears under the AWS tab
   - `["terraform", "aws"]` -- appears under both Terraform and AWS tabs
   - `["sre", "devops"]` -- appears under both SRE and DevOps topic tabs

### Example: Adding an AWS Security Blog

Using the script:
```
Source name: AWS Security Blog
Website URL: https://aws.amazon.com/blogs/security/
RSS/Atom feed URL: https://aws.amazon.com/blogs/security/feed/
Type: blog
Tags: aws,secops
Popularity: high
```

This source will now appear under both the **AWS** product tab and the **SecOps** topic tab.

---

## Adding a New PRODUCT (Top-Level Tab)

A "product" is a top-level item in the sidebar like AWS, Terraform, Datadog, or Slack.

### Steps

1. **Edit `data/config.json`** -- add a new entry to the `"products"` array:
   ```json
   { "id": "kubernetes", "label": "Kubernetes", "icon": "...", "tags": ["kubernetes"] }
   ```

   - `id` -- lowercase, use hyphens for spaces (e.g., `"github-copilot"`)
   - `label` -- display name shown in the sidebar
   - `icon` -- an emoji for the tab
   - `tags` -- array of tag strings used to match news items (usually just `["your-id"]`)

2. **Add sources** with matching tags so the new tab has content. Use `add-source.sh` or edit `data/sources.json` directly, making sure at least one source has `"kubernetes"` in its tags array.

3. **Done.** The website reads `config.json` on every page load, so the new tab appears automatically once the file is committed.

### Using the Helper Script

```
cd scripts
./add-product.sh
```

The script asks for the ID, label, and icon, then adds it to config.json.

### Example: Adding Kubernetes

1. Edit `data/config.json`:
   ```json
   { "id": "kubernetes", "label": "Kubernetes", "icon": "...", "tags": ["kubernetes"] }
   ```

2. Add some sources:
   ```
   ./add-source.sh
   Source name: Kubernetes Blog
   Website URL: https://kubernetes.io/blog/
   RSS/Atom feed URL: https://kubernetes.io/feed.xml
   Type: blog
   Tags: kubernetes
   Popularity: high
   ```

3. Commit and push. The tab appears on the site immediately; news arrives on the next collection run.

---

## Adding a Sub-Tab (Child Tab)

Sub-tabs live under a parent product and provide more granular filtering. For example, Terraform has sub-tabs for "AWS Provider", "Azure Provider", etc.

### Steps

1. **Edit `data/config.json`** -- find the parent product and add to its `"children"` array:
   ```json
   {
     "id": "terraform", "label": "Terraform", "icon": "...", "tags": ["terraform"],
     "children": [
       {
         "id": "tf-helm-provider",
         "label": "Helm Provider",
         "icon": "...",
         "tags": ["terraform"],
         "filter_source": "Terraform Helm Provider"
       }
     ]
   }
   ```

2. **Understand the fields**:
   - `id` -- unique identifier, typically prefixed with the parent (e.g., `tf-helm-provider`)
   - `label` -- display name in the sidebar
   - `icon` -- emoji
   - `tags` -- should include the parent's tag (`"terraform"`) plus any cross-tags
   - `filter_source` -- **this is the key field** -- it matches against `source_name` in news items, so items must come from a source whose name contains this string

3. **Add a source** whose `name` matches the `filter_source` value:
   ```json
   {
     "name": "Terraform Helm Provider",
     "url": "https://github.com/hashicorp/terraform-provider-helm",
     "rss_url": "https://github.com/hashicorp/terraform-provider-helm/releases.atom",
     "type": "blog",
     "tags": ["terraform"]
   }
   ```

4. The sub-tab appears nested under the parent in the sidebar.

### Example: Adding an AWS Security Blog Sub-Tab Under AWS

1. Edit `data/config.json` -- add children to the AWS product:
   ```json
   {
     "id": "aws", "label": "AWS", "icon": "...", "tags": ["aws"],
     "children": [
       {
         "id": "aws-security-blog",
         "label": "Security Blog",
         "icon": "...",
         "tags": ["aws", "secops"],
         "filter_source": "AWS Security Blog"
       }
     ]
   }
   ```

2. Make sure there is a source with `"name": "AWS Security Blog"` in `data/sources.json`.

3. The sub-tab filters items to only those from the AWS Security Blog source, while the parent AWS tab continues to show all AWS content.

### How filter_source Works

When a sub-tab has `filter_source`, the filtering logic is:
- Item must match at least one tag in the sub-tab's `tags` array, **AND**
- Item's `source_name` must contain the `filter_source` string

This is how sub-tabs show a focused subset of a parent's content.

---

## Adding a New Section

Sections are the top-level groupings in the sidebar. Currently there are three: **Products**, **Topics**, and **Software**. You might add more like "Platforms" or "Frameworks".

This requires changes to four files.

### Steps

1. **Edit `data/config.json`** -- add a new top-level key:
   ```json
   {
     "products": [ ... ],
     "topics": [ ... ],
     "software": [
       { "id": "docker", "label": "Docker", "icon": "...", "tags": ["docker"] },
       { "id": "nginx", "label": "NGINX", "icon": "...", "tags": ["nginx"] }
     ]
   }
   ```

2. **Edit `js/tabs.js`** -- update the `loadTabConfig` function to process the new section. Find the block that processes `config.topics` and add a similar block after it:
   ```js
   (config.software || []).forEach(function(s) {
     tabs.push({
       id: s.id, label: s.label, icon: s.icon, group: 'software',
       tags: s.tags || [s.id]
     });
   });
   ```

3. **Edit `index.html`** -- find the sidebar section that contains the Products and Topics expandable groups. Copy one of the existing sections and modify it for the new group name. Look for the `expandProducts` / `expandTopics` patterns and replicate for `expandSoftware`.

4. **Edit `js/app.js`** -- add the expand state variable alongside the existing ones:
   ```js
   expandProducts: true,
   expandTopics: true,
   expandSoftware: true,   // <-- add this
   ```

5. **Add sources** with tags matching your new section's items.

### Example: Adding a "Software" Section

After making the four file changes above and adding sources tagged with `docker` and `nginx`, the sidebar would show:

```
Products
  AWS
  Azure
  Terraform
  ...

Topics
  SRE
  DevOps
  ...

Software        <-- new section
  Docker
  NGINX
```

---

## Decision Guide: When to Use What

| You want to...                                         | Use...          |
|--------------------------------------------------------|-----------------|
| Track a new blog, feed, or channel for an existing tab | **Source**      |
| Create a distinct product/tool/topic with its own tab  | **Product/Topic** (top-level tab) |
| Focus on a specific sub-area within an existing product| **Sub-tab** (child) |
| Create a completely new category of items              | **Section**     |

### Rules of Thumb

- **Source**: "I found a great AWS blog I want to track." Just add a source with the `aws` tag.
- **Top-level tab**: "We started using Kubernetes and want a dedicated tab for it." Add a product, then add sources.
- **Sub-tab**: "The Terraform AWS Provider releases are buried in all the Terraform news. I want them separate." Add a child under Terraform with `filter_source`.
- **Section**: "Products and Topics are not enough. We need a 'Software' category for things like Docker, NGINX, Redis." Add a new section (requires code changes in four files).

---

## How the Site Rebuilds

Understanding the deployment cycle helps you know when your changes take effect.

### The Daily Cycle

1. **GitHub Actions** runs the collection workflow every day at **04:00 UTC (06:00 SAST)**.
2. The pipeline fetches all RSS feeds defined in `data/sources.json`.
3. New items are added to `data/news.json`.
4. The pipeline commits and pushes updated `data/` files to the `main` branch.
5. The push triggers **GitHub Pages deployment**, which makes the new data live.

### When Do Changes Take Effect?

| Change                        | When it appears on the site                   |
|-------------------------------|-----------------------------------------------|
| Edit `config.json` (new tab)  | Next page load after the commit is on `main`  |
| Add a source                  | Data arrives on the next collection run (06:00 SAST), then shows on next page load |
| Edit `index.html` or `js/`    | Next page load after the commit is on `main`  |
| Add a sub-tab                 | Tab appears immediately on next load; data appears after next collection run if the source is new |

### Running Collection Manually

If you do not want to wait for the daily run:

```
cd scripts
npm ci              # install dependencies (first time only)
node parse-sources.js
node collect.js
node build.js
```

Or trigger the GitHub Actions workflow manually from the Actions tab in the repository (the workflow supports `workflow_dispatch`).

### Quick Reference: File Locations

| What you want to change         | File to edit                |
|---------------------------------|-----------------------------|
| Add/remove a source             | `data/sources.json`         |
| Add/remove a tab or sub-tab     | `data/config.json`          |
| Change sidebar layout           | `index.html`                |
| Change tab loading logic        | `js/tabs.js`                |
| Change app state or behaviour   | `js/app.js`                 |
| Change search logic             | `js/search.js`              |
| Change export formats           | `js/export.js`              |
| Change collection logic         | `scripts/collect.js`        |
| Change the daily schedule       | `.github/workflows/collect.yml` |

---

## Contributing via Pull Requests

The `main` branch is protected. All changes should go through PRs:

1. Create a branch: `git checkout -b feature/add-spring-boot` or `sources/add-medium-blogs`
2. Make your changes and push: `git push -u origin feature/add-spring-boot`
3. Open a PR — it will be **auto-labeled** based on changed files (e.g., `sources`, `frontend`, `docs`)
4. Get 1 approval, then merge
5. The **release drafter** auto-updates a draft release with your PR grouped by category

### Branch naming convention

| Prefix | Use for |
|--------|---------|
| `feature/*` | New functionality |
| `fix/*` | Bug fixes |
| `chore/*` | Maintenance, deps, CI |
| `docs/*` | Documentation only |
| `sources/*` | Adding/updating sources |

See [RELEASE_STRATEGY.md](RELEASE_STRATEGY.md) for the full versioning and release process.
