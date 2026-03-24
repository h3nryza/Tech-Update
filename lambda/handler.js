/**
 * Lambda handler for Tech Update daily news collection.
 *
 * Replaces the GitHub Actions collect.yml cron job to save build minutes.
 * Downloads repo files via GitHub API, runs the pipeline in /tmp,
 * and pushes updated data files back as a commit.
 *
 * Environment variables:
 *   GITHUB_TOKEN  - GitHub PAT with repo write access
 *   GITHUB_OWNER  - Repository owner (e.g., "h3nryza")
 *   GITHUB_REPO   - Repository name (e.g., "Tech-Update")
 *   GITHUB_BRANCH - Branch to update (default: "main")
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { join } from 'path';

const WORK_DIR = '/tmp/tech-update';
const SCRIPTS_DIR = join(WORK_DIR, 'scripts');
const DATA_DIR = join(WORK_DIR, 'data');

// Files to download from the repo (read-only inputs)
const INPUT_FILES = [
  'feeds.md',
  'data/sources.json',
  'data/news.json',
  'data/config.json',
  'data/index.json',
  'data/stats.json',
];

// Files to push back to the repo after pipeline runs
const OUTPUT_FILES = [
  'data/sources.json',
  'data/news.json',
  'data/index.json',
  'data/stats.json',
];

// ─── GitHub API helpers ──────────────────────────────────────────

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'TechUpdate-Lambda/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function apiUrl(path) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  return `https://api.github.com/repos/${owner}/${repo}/${path}`;
}

async function githubGet(path) {
  const res = await fetch(apiUrl(path), { headers: githubHeaders() });
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function githubPost(path, body) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub POST ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── File download/upload via GitHub Contents API ────────────────

async function downloadFile(repoPath) {
  try {
    const data = await githubGet(`contents/${repoPath}?ref=${branch()}`);
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    // Resolve and validate path stays within WORK_DIR (path traversal guard)
    const localPath = join(WORK_DIR, repoPath);
    if (!localPath.startsWith(WORK_DIR)) {
      throw new Error(`Path traversal blocked: ${repoPath}`);
    }

    const dir = localPath.substring(0, localPath.lastIndexOf('/'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(localPath, content, { mode: 0o600 }); // lgtm[js/insecure-temporary-file]
    console.log(`  Downloaded: ${repoPath} (${content.length} bytes)`);
    return data.sha;
  } catch (err) {
    console.log(`  Skipped: ${repoPath} (${err.message})`);
    return null;
  }
}

function branch() {
  return process.env.GITHUB_BRANCH || 'main';
}

// ─── Git tree API for atomic multi-file commits ──────────────────

async function getLatestCommitSha() {
  const ref = await githubGet(`git/ref/heads/${branch()}`);
  return ref.object.sha;
}

async function getTreeSha(commitSha) {
  const commit = await githubGet(`git/commits/${commitSha}`);
  return commit.tree.sha;
}

async function createBlob(content) {
  const blob = await githubPost('git/blobs', {
    content: Buffer.from(content).toString('base64'),
    encoding: 'base64',
  });
  return blob.sha;
}

async function createTree(baseTreeSha, files) {
  const tree = [];
  for (const { path, content } of files) {
    const blobSha = await createBlob(content);
    tree.push({ path, mode: '100644', type: 'blob', sha: blobSha });
  }
  const result = await githubPost('git/trees', {
    base_tree: baseTreeSha,
    tree,
  });
  return result.sha;
}

async function createCommit(treeSha, parentSha, message) {
  const commit = await githubPost('git/commits', {
    message,
    tree: treeSha,
    parents: [parentSha],
    author: {
      name: 'tech-update-lambda',
      email: 'tech-update-lambda@users.noreply.github.com',
      date: new Date().toISOString(),
    },
  });
  return commit.sha;
}

async function updateRef(commitSha) {
  const res = await fetch(apiUrl(`git/refs/heads/${branch()}`), {
    method: 'PATCH',
    headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commitSha }),
  });
  if (!res.ok) throw new Error(`Update ref: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Pipeline execution ──────────────────────────────────────────

function runScript(name) {
  console.log(`\n--- Running ${name} ---`);
  const result = execSync(`node ${name}`, {
    cwd: SCRIPTS_DIR,
    env: { ...process.env, NODE_PATH: join(SCRIPTS_DIR, 'node_modules') },
    stdio: 'pipe',
    timeout: 5 * 60 * 1000, // 5 minutes per script
  });
  console.log(result.toString());
}

// ─── Main handler ────────────────────────────────────────────────

export async function handler(event) {
  const startTime = Date.now();
  console.log('Tech Update Lambda — starting collection');
  console.log(`Event: ${JSON.stringify(event)}`);

  try {
    // 1. Prepare working directory
    console.log('\n=== Preparing workspace ===');
    mkdirSync(WORK_DIR, { recursive: true });
    mkdirSync(join(DATA_DIR, 'archive'), { recursive: true });
    mkdirSync(SCRIPTS_DIR, { recursive: true });

    // 2. Copy bundled scripts to working directory
    //    (scripts are packaged alongside handler.js in the Lambda zip)
    const lambdaDir = new URL('.', import.meta.url).pathname;
    const bundledScripts = join(lambdaDir, 'scripts');
    if (existsSync(bundledScripts)) {
      cpSync(bundledScripts, SCRIPTS_DIR, { recursive: true });
      console.log('Copied bundled scripts to workspace');
    }

    // 3. Download input files from GitHub
    console.log('\n=== Downloading files from GitHub ===');
    for (const file of INPUT_FILES) {
      await downloadFile(file);
    }

    // Copy feeds.md to work dir root (parse-sources.js expects it at ROOT/..)
    // The scripts use ROOT = join(__dirname, '..') so we need:
    //   /tmp/tech-update/scripts/parse-sources.js  (script location)
    //   /tmp/tech-update/feeds.md                  (ROOT/feeds.md)
    //   /tmp/tech-update/data/                     (ROOT/data/)

    // 4. Run the pipeline
    console.log('\n=== Running pipeline ===');
    runScript('parse-sources.js');
    runScript('collect.js');
    runScript('build.js');

    // 5. Run tests
    console.log('\n=== Running test suite ===');
    try {
      runScript('test-feeds.js');
    } catch (testErr) {
      console.error('Test suite failed:', testErr.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Test suite failed', details: testErr.message }),
      };
    }

    // 6. Read output files and check for changes
    console.log('\n=== Checking for changes ===');
    const changedFiles = [];
    for (const filePath of OUTPUT_FILES) {
      const localPath = join(WORK_DIR, filePath);
      if (existsSync(localPath)) {
        const content = readFileSync(localPath, 'utf-8');
        changedFiles.push({ path: filePath, content });
      }
    }

    // Also check for new archive files
    const archiveDir = join(DATA_DIR, 'archive');
    if (existsSync(archiveDir)) {
      const { readdirSync } = await import('fs');
      for (const file of readdirSync(archiveDir)) {
        if (file.startsWith('week-') && file.endsWith('.json')) {
          const archivePath = `data/archive/${file}`;
          const content = readFileSync(join(archiveDir, file), 'utf-8');
          changedFiles.push({ path: archivePath, content });
        }
      }
    }

    if (changedFiles.length === 0) {
      console.log('No changes to commit');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No changes', duration_ms: Date.now() - startTime }),
      };
    }

    // 7. Create atomic commit via GitHub Git Data API
    console.log(`\n=== Committing ${changedFiles.length} files to GitHub ===`);
    const latestSha = await getLatestCommitSha();
    const treeSha = await getTreeSha(latestSha);
    const newTreeSha = await createTree(treeSha, changedFiles);

    const date = new Date().toISOString().split('T')[0];
    const commitSha = await createCommit(
      newTreeSha,
      latestSha,
      `chore: daily news collection ${date} (lambda)`
    );
    await updateRef(commitSha);

    const duration = Date.now() - startTime;
    console.log(`\nDone! Commit: ${commitSha} (${duration}ms)`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Collection complete',
        commit: commitSha,
        files_updated: changedFiles.length,
        duration_ms: duration,
      }),
    };
  } catch (err) {
    console.error('Lambda error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, stack: err.stack }),
    };
  }
}
