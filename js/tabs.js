// Tab definitions — loaded dynamically from data/config.json
// Fallback to hardcoded if config.json not available

// Default tabs (used as fallback)
var DEFAULT_TABS = [
  { id: 'aws', label: 'AWS', icon: '☁️', group: 'products', tags: ['aws'] },
  { id: 'azure', label: 'Azure', icon: '🔷', group: 'products', tags: ['azure'] },
  { id: 'terraform', label: 'Terraform', icon: '🏗️', group: 'products', tags: ['terraform'], children: [
    { id: 'tf-aws-provider', label: 'AWS Provider', icon: '☁️', group: 'products', tags: ['terraform', 'aws'], parentId: 'terraform' },
    { id: 'tf-azure-provider', label: 'Azure Provider', icon: '🔷', group: 'products', tags: ['terraform', 'azure'], parentId: 'terraform' },
    { id: 'tf-cloudflare-provider', label: 'Cloudflare Provider', icon: '🔶', group: 'products', tags: ['terraform', 'cloudflare'], parentId: 'terraform' },
    { id: 'tf-google-provider', label: 'Google Provider', icon: '🔵', group: 'products', tags: ['terraform'], parentId: 'terraform' },
  ] },
  { id: 'tf-aws-provider', label: 'AWS Provider', icon: '☁️', group: 'products', tags: ['terraform', 'aws'], parentId: 'terraform' },
  { id: 'tf-azure-provider', label: 'Azure Provider', icon: '🔷', group: 'products', tags: ['terraform', 'azure'], parentId: 'terraform' },
  { id: 'tf-cloudflare-provider', label: 'Cloudflare Provider', icon: '🔶', group: 'products', tags: ['terraform', 'cloudflare'], parentId: 'terraform' },
  { id: 'tf-google-provider', label: 'Google Provider', icon: '🔵', group: 'products', tags: ['terraform'], parentId: 'terraform' },
  { id: 'cloudflare', label: 'Cloudflare', icon: '🔶', group: 'products', tags: ['cloudflare'] },
  { id: 'datadog', label: 'Datadog', icon: '🐶', group: 'products', tags: ['datadog'] },
  { id: 'claude', label: 'Claude', icon: '🤖', group: 'products', tags: ['claude'] },
  { id: 'gemini', label: 'Gemini', icon: '♊', group: 'products', tags: ['gemini'] },
  { id: 'openai', label: 'OpenAI', icon: '🧠', group: 'products', tags: ['openai'] },
  { id: 'github-copilot', label: 'GitHub Copilot', icon: '🤝', group: 'products', tags: ['github-copilot'] },
  { id: 'slack', label: 'Slack', icon: '💬', group: 'products', tags: ['slack'] },
  { id: 'obsidian', label: 'Obsidian', icon: '💎', group: 'products', tags: ['obsidian'] },
  { id: 'notion', label: 'Notion', icon: '📝', group: 'products', tags: ['notion'] },
  { id: 'vs-code', label: 'VS Code', icon: '💻', group: 'products', tags: ['vs-code'] },
  { id: 'sre', label: 'SRE', icon: '🔧', group: 'topics', tags: ['sre'] },
  { id: 'platform-engineering', label: 'Platform Eng', icon: '🏭', group: 'topics', tags: ['platform-engineering'] },
  { id: 'devops', label: 'DevOps', icon: '♾️', group: 'topics', tags: ['devops'] },
  { id: 'secops', label: 'SecOps', icon: '🛡️', group: 'topics', tags: ['secops'] },
  { id: 'software-engineering', label: 'Software Eng', icon: '⚙️', group: 'topics', tags: ['software-engineering'] },
  { id: 'automation', label: 'Automation', icon: '🤖', group: 'topics', tags: ['automation'] },
  { id: 'orchestration', label: 'Orchestration', icon: '🎯', group: 'topics', tags: ['orchestration'] },
  { id: 'cloud-architecture', label: 'Cloud Arch', icon: '🌐', group: 'topics', tags: ['cloud-architecture'] },
  { id: 'software-architecture', label: 'Software Arch', icon: '📐', group: 'topics', tags: ['software-architecture'] },
];

// Start with defaults, then load config.json asynchronously
window.TABS = DEFAULT_TABS;
window.TABS_LOADED = false;

// Load config dynamically — this updates TABS in-place before Alpine renders
window.loadTabConfig = function() {
  return fetch('data/config.json')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(config) {
      if (!config) return;
      var tabs = [];
      (config.products || []).forEach(function(p) {
        tabs.push({
          id: p.id, label: p.label, icon: p.icon, group: 'products',
          tags: p.tags || [p.id],
          children: (p.children || []).map(function(c) {
            return {
              id: c.id, label: c.label, icon: c.icon, group: 'products',
              tags: c.tags || [c.id], parentId: p.id,
              filter_source: c.filter_source || null,
            };
          }),
        });
        // Also add children as standalone tabs for filtering
        (p.children || []).forEach(function(c) {
          tabs.push({
            id: c.id, label: c.label, icon: c.icon, group: 'products',
            tags: c.tags || [c.id], parentId: p.id,
            filter_source: c.filter_source || null,
          });
        });
      });
      (config.topics || []).forEach(function(t) {
        tabs.push({ id: t.id, label: t.label, icon: t.icon, group: 'topics', tags: t.tags || [t.id] });
      });
      (config.software || []).forEach(function(s) {
        tabs.push({
          id: s.id, label: s.label, icon: s.icon, group: 'software',
          tags: s.tags || [s.id],
          children: (s.children || []).map(function(c) {
            return {
              id: c.id, label: c.label, icon: c.icon, group: 'software',
              tags: c.tags || [c.id], parentId: s.id,
              filter_source: c.filter_source || null,
            };
          }),
        });
        (s.children || []).forEach(function(c) {
          tabs.push({
            id: c.id, label: c.label, icon: c.icon, group: 'software',
            tags: c.tags || [c.id], parentId: s.id,
            filter_source: c.filter_source || null,
          });
        });
      });
      if (tabs.length > 0) {
        // Replace in-place so Alpine picks it up
        window.TABS.length = 0;
        tabs.forEach(function(t) { window.TABS.push(t); });
      }
      window.TABS_LOADED = true;
    })
    .catch(function() {
      window.TABS_LOADED = true; // Use defaults
    });
};

window.TAG_COLORS = {
  '#new': { emoji: '🟢', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
  '#update': { emoji: '🔵', bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200' },
  '#feature': { emoji: '🟣', bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200' },
  '#breaking-change': { emoji: '🔴', bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
  '#security': { emoji: '🟠', bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200' },
  '#zero-day': { emoji: '⚫', bg: 'bg-gray-800 dark:bg-gray-200', text: 'text-white dark:text-gray-900' },
  '#tutorial': { emoji: '🟡', bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' },
  '#podcast': { emoji: '🎙️', bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-800 dark:text-pink-200' },
  '#article': { emoji: '📰', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
  '#video': { emoji: '🎬', bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300' },
  '#social': { emoji: '💬', bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200' },
  '#release': { emoji: '📦', bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-800 dark:text-teal-200' },
  '#stable': { emoji: '✅', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
  '#beta': { emoji: '🧪', bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-800 dark:text-amber-200' },
  '#alpha': { emoji: '⚗️', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
};
