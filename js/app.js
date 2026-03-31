// Register Alpine.js data component
document.addEventListener('alpine:init', function() {
  Alpine.data('app', function() {
    return {
      // State
      tabs: window.TABS,
      tagColors: window.TAG_COLORS,
      activeTab: 'all',
      items: [],
      sources: [],
      loading: true,
      error: null,
      lastUpdated: null,

      // Search & filters
      searchQuery: '',
      globalSearch: false,
      datePreset: '',
      dateStart: '',
      dateEnd: '',

      // Advanced search builder
      showAdvanced: false,
      advancedLogic: 'AND',
      advancedConditions: [],
      useAdvancedSearch: false,

      // Column include/exclude filters
      columnFilters: [],
      showColumnFilters: false,

      // Sort
      sortColumn: 'published',
      sortDirection: 'desc',

      // Theme
      theme: 'light',

      // Sidebar & mobile
      sidebarOpen: true,
      expandProducts: true,
      expandTopics: true,
      expandSoftware: true,
      showMobileMenu: false,
      showFilters: false,

      // Column ordering & resizing
      columnOrder: ['date', 'title', 'version', 'source', 'tldr', 'tags', 'views'],
      colDefs: {
        date:    { label: 'Date',    sortKey: 'published' },
        title:   { label: 'Title',   sortKey: 'title' },
        version: { label: 'Version', sortKey: 'version' },
        source:  { label: 'Source',  sortKey: 'source_name' },
        tldr:    { label: 'TLDR',    sortKey: null },
        tags:    { label: 'Tags',    sortKey: 'tags' },
        views:   { label: 'Views',   sortKey: 'views' },
      },
      defaultColWidths: { date: 100, title: 240, version: 80, source: 120, tldr: 300, tags: 150, views: 70 },
      colWidths: { date: 100, title: 240, version: 80, source: 120, tldr: 300, tags: 150, views: 70 },
      _resizeCol: null,
      _resizeStartX: 0,
      _resizeStartW: 0,

      init: function() {
        this.theme = window.initTheme();
        var self = this;
        // Load dynamic config first, then data
        window.loadTabConfig().then(function() {
          self.tabs = window.TABS;
          self.tagColors = window.TAG_COLORS;
          // Load data after tabs so counts render correctly
          self.loadData();
        }).catch(function() {
          // Fallback: load data with default tabs
          self.loadData();
        });

        // Restore column order and widths from localStorage
        var saved = localStorage.getItem('columnOrder');
        if (saved) {
          try { this.columnOrder = JSON.parse(saved); } catch(e) {}
        }
        var savedWidths = localStorage.getItem('colWidths');
        if (savedWidths) {
          try { this.colWidths = JSON.parse(savedWidths); } catch(e) {}
        }

        // Handle URL params
        var params = new URLSearchParams(window.location.search);
        if (params.get('tab')) this.activeTab = params.get('tab');
        if (params.get('q')) this.searchQuery = params.get('q');
        if (params.get('from')) this.dateStart = params.get('from');
        if (params.get('to')) this.dateEnd = params.get('to');
      },

      loadData: function() {
        var self = this;
        self.loading = true;

        Promise.all([
          fetch('data/news.json').then(function(r) { return r.ok ? r.json() : { items: [] }; }).catch(function() { return { items: [] }; }),
          fetch('data/sources.json').then(function(r) { return r.ok ? r.json() : { sources: [] }; }).catch(function() { return { sources: [] }; }),
        ]).then(function(results) {
          // Add _expanded flag to each item for TLDR toggle
          var items = results[0].items || [];
          items.forEach(function(item) { item._expanded = false; });
          self.items = items;
          self.lastUpdated = results[0].generated || null;
          self.sources = results[1].sources || [];
          self.error = null;
          if (self.items.length === 0) {
            self.error = 'No news data found. Run the collection scripts first.';
          }
        }).catch(function(err) {
          self.error = 'Failed to load data. Run the collection scripts first.';
          console.error(err);
        }).finally(function() {
          self.loading = false;
        });
      },

      // Computed
      get activeTabDef() {
        if (this.activeTab === 'all') {
          return { id: 'all', label: 'All Items', icon: '\uD83D\uDCCB', tags: [], group: 'all' };
        }
        var self = this;
        return this.tabs.find(function(t) { return t.id === self.activeTab; }) || this.tabs[0];
      },

      get filteredItems() {
        var items = this.items;

        // "All Items" tab or global search with query — skip tag filtering
        if (this.activeTab === 'all') {
          // No tag filtering — show everything
        } else if (!this.globalSearch || !this.searchQuery) {
          var tabDef = this.activeTabDef;
          var tabTags = tabDef.tags;
          var filterSource = tabDef.filter_source;
          items = items.filter(function(item) {
            var tagMatch = item.tags.some(function(t) { return tabTags.indexOf(t) !== -1; });
            if (filterSource) {
              return tagMatch && item.source_name && item.source_name.indexOf(filterSource) !== -1;
            }
            return tagMatch;
          });
        }

        // Apply search — advanced or simple
        if (this.useAdvancedSearch && this.advancedConditions.length > 0) {
          items = window.advancedSearchItems(items, this.advancedConditions, this.advancedLogic);
        } else {
          items = window.searchItems(items, this.searchQuery);
        }

        // Apply date range filter
        items = window.filterByDateRange(items, this.dateStart, this.dateEnd);

        // Apply column include/exclude filters
        items = window.applyColumnFilters(items, this.columnFilters);

        // Apply sort
        items = window.sortItems(items, this.sortColumn, this.sortDirection);

        return items;
      },

      get tabCounts() {
        var counts = {};
        var allItems = this.items;
        counts['all'] = allItems.length;
        this.tabs.forEach(function(tab) {
          counts[tab.id] = allItems.filter(function(item) {
            var tagMatch = item.tags.some(function(t) { return tab.tags.indexOf(t) !== -1; });
            if (tab.filter_source) {
              return tagMatch && item.source_name && item.source_name.indexOf(tab.filter_source) !== -1;
            }
            return tagMatch;
          }).length;
        });
        return counts;
      },

      // All unique #tags with counts for quick-pick
      get allTagsWithCounts() {
        var counts = {};
        this.items.forEach(function(item) {
          item.tags.forEach(function(t) {
            if (t.startsWith('#')) {
              counts[t] = (counts[t] || 0) + 1;
            }
          });
        });
        // Sort by count descending
        var sorted = Object.keys(counts).map(function(tag) {
          return { tag: tag, count: counts[tag] };
        });
        sorted.sort(function(a, b) { return b.count - a.count; });
        return sorted;
      },

      get dateRangeDisplay() {
        if (this.dateStart && this.dateEnd) {
          return this.dateStart + ' to ' + this.dateEnd;
        }
        if (this.items.length > 0) {
          var newest = this.items[0] && this.items[0].published ? this.items[0].published.slice(0, 10) : '—';
          var oldest = this.items[this.items.length - 1] && this.items[this.items.length - 1].published ? this.items[this.items.length - 1].published.slice(0, 10) : '—';
          return oldest + ' to ' + newest;
        }
        return 'No data';
      },

      // Methods
      setTab: function(tabId) {
        this.activeTab = tabId;
        this.showMobileMenu = false;
        this.updateUrl();
        var self = this;
        this.$nextTick(function() {
          var el = document.getElementById('tab-' + tabId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      },

      setSort: function(column) {
        if (!column) return; // non-sortable columns like tldr, tags
        if (this.sortColumn === column) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = column;
          this.sortDirection = column === 'published' ? 'desc' : 'asc';
        }
      },

      setDatePreset: function(preset) {
        this.datePreset = preset;
        if (preset === 'all') {
          this.dateStart = '';
          this.dateEnd = '';
          return;
        }
        var range = window.getDatePreset(preset);
        this.dateStart = range.start || '';
        this.dateEnd = range.end || '';
        this.updateUrl();
      },

      toggleGlobalSearch: function() {
        this.globalSearch = !this.globalSearch;
      },

      // Quick tag click — toggles tag in search query
      toggleTagInSearch: function(tag) {
        var q = this.searchQuery.trim();
        if (q.indexOf(tag) !== -1) {
          // Remove tag
          this.searchQuery = q.replace(tag, '').replace(/\s+/g, ' ').trim();
        } else {
          this.searchQuery = q ? q + ' ' + tag : tag;
        }
        this.useAdvancedSearch = false;
        this.updateUrl();
      },

      isTagActive: function(tag) {
        return (' ' + this.searchQuery + ' ').indexOf(' ' + tag + ' ') !== -1 || this.searchQuery === tag;
      },

      // Advanced search builder
      toggleAdvanced: function() {
        this.showAdvanced = !this.showAdvanced;
        if (this.showAdvanced && this.advancedConditions.length === 0) {
          this.addCondition();
        }
      },

      addCondition: function() {
        this.advancedConditions.push({ field: 'any', value: '', operator: 'contains', negate: false });
      },

      removeCondition: function(idx) {
        this.advancedConditions.splice(idx, 1);
        if (this.advancedConditions.length === 0) {
          this.useAdvancedSearch = false;
        }
      },

      applyAdvancedSearch: function() {
        var hasValues = this.advancedConditions.some(function(c) { return c.value.trim(); });
        this.useAdvancedSearch = hasValues;
        if (hasValues) {
          this.searchQuery = ''; // Clear simple search when using advanced
        }
      },

      clearAdvancedSearch: function() {
        this.advancedConditions = [];
        this.useAdvancedSearch = false;
        this.showAdvanced = false;
      },

      // Column filters (include/exclude)
      toggleColumnFilters: function() {
        this.showColumnFilters = !this.showColumnFilters;
        if (this.showColumnFilters && this.columnFilters.length === 0) {
          this.addColumnFilter();
        }
      },

      addColumnFilter: function() {
        this.columnFilters.push({ column: 'title', value: '', mode: 'include', operator: 'contains' });
      },

      removeColumnFilter: function(idx) {
        this.columnFilters.splice(idx, 1);
      },

      clearColumnFilters: function() {
        this.columnFilters = [];
        this.showColumnFilters = false;
      },

      doToggleTheme: function() {
        this.theme = window.toggleThemeMode();
      },

      updateUrl: function() {
        var params = new URLSearchParams();
        if (this.activeTab !== 'aws') params.set('tab', this.activeTab);
        if (this.searchQuery) params.set('q', this.searchQuery);
        if (this.dateStart) params.set('from', this.dateStart);
        if (this.dateEnd) params.set('to', this.dateEnd);
        var qs = params.toString();
        window.history.replaceState({}, '', qs ? '?' + qs : window.location.pathname);
      },

      formatDate: function(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-ZA', {
          year: 'numeric', month: 'short', day: 'numeric',
        });
      },

      formatViews: function(views) {
        if (!views) return '—';
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
        return views.toString();
      },

      getTagStyle: function(tag) {
        return this.tagColors[tag] || {
          emoji: '',
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
        };
      },

      // Column resize
      totalTableWidth: function() {
        var self = this;
        var total = 0;
        this.columnOrder.forEach(function(col) { total += (self.colWidths[col] || 100); });
        return total;
      },

      startResize: function(e, col) {
        var self = this;
        self._resizeCol = col;
        self._resizeStartX = e.clientX;
        self._resizeStartW = self.colWidths[col];

        var onMove = function(ev) {
          if (!self._resizeCol) return;
          var diff = ev.clientX - self._resizeStartX;
          var newW = Math.max(50, self._resizeStartW + diff);
          self.colWidths[col] = newW;
        };

        var onUp = function() {
          self._resizeCol = null;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          // Persist
          localStorage.setItem('colWidths', JSON.stringify(self.colWidths));
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      },

      resetColWidths: function() {
        var self = this;
        var defaults = this.defaultColWidths;
        Object.keys(defaults).forEach(function(k) { self.colWidths[k] = defaults[k]; });
        localStorage.removeItem('colWidths');
      },

      // Export
      doExportCSV: function() {
        window.exportCSV(this.filteredItems, 'tech-update-' + this.activeTab);
      },
      doExportJSON: function() {
        window.exportJSON(this.filteredItems, 'tech-update-' + this.activeTab);
      },
      doExportPDF: function() {
        var title = 'Tech Update — ' + this.activeTabDef.label + ' (' + this.dateRangeDisplay + ')';
        window.exportPDF(this.filteredItems, 'tech-update-' + this.activeTab, title);
      },

      // Share modal (unified)
      showShareModal: false,
      shareModalItem: null,
      shareToast: '',
      copiedLink: false,

      get shareModalPreview() {
        if (this.shareModalItem) {
          return this.shareModalItem.title + '\n' + (this.shareModalItem.tldr || '').slice(0, 200) + '\n\n' + this.shareModalItem.url;
        }
        return 'Tech Update — ' + this.activeTabDef.label + '\n' + window.location.href;
      },

      openShareModal: function(item) {
        this.shareModalItem = item;
        this.copiedLink = false;
        this.showShareModal = true;
      },

      closeShareModal: function() {
        this.showShareModal = false;
        this.shareModalItem = null;
        this.copiedLink = false;
      },

      doShare: function(platform) {
        var item = this.shareModalItem;
        var shareUrl = item ? item.url : window.location.href;
        var shareTitle = item ? item.title : 'Tech Update — ' + this.activeTabDef.label;
        var shareText = item ? (item.title + ' — ' + (item.tldr || '').slice(0, 100)) : shareTitle;
        var encUrl = encodeURIComponent(shareUrl);
        var encTitle = encodeURIComponent(shareTitle);
        var encText = encodeURIComponent(shareText);
        var self = this;

        switch (platform) {
          case 'copy':
            navigator.clipboard.writeText(shareUrl).then(function() {
              self.copiedLink = true;
              self.showShareToast('Link copied!');
              setTimeout(function() { self.copiedLink = false; }, 2000);
            });
            return;
          case 'email':
            window.open('mailto:?subject=' + encTitle + '&body=' + encText + '%0A%0A' + encUrl);
            break;
          case 'teams':
            window.open('https://teams.microsoft.com/share?href=' + encUrl + '&msgText=' + encTitle);
            break;
          case 'slack':
            window.open('https://slack.com/share?url=' + encUrl + '&text=' + encTitle);
            break;
          case 'x':
            window.open('https://x.com/intent/tweet?text=' + encTitle + '&url=' + encUrl);
            break;
          case 'linkedin':
            window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encUrl);
            break;
          case 'reddit':
            window.open('https://www.reddit.com/submit?url=' + encUrl + '&title=' + encTitle);
            break;
          case 'whatsapp':
            window.open('https://wa.me/?text=' + encTitle + '%20' + encUrl);
            break;
          case 'telegram':
            window.open('https://t.me/share/url?url=' + encUrl + '&text=' + encTitle);
            break;
          case 'native':
            if (navigator.share) {
              navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(function() {});
            }
            break;
        }
        this.closeShareModal();
      },

      showShareToast: function(msg) {
        var self = this;
        self.shareToast = msg;
        setTimeout(function() { self.shareToast = ''; }, 2000);
      },

      // Debounced search
      searchDebounceTimer: null,
      onSearchInput: function(e) {
        var self = this;
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(function() {
          self.searchQuery = e.target.value;
          self.updateUrl();
        }, 300);
      },
    };
  });
});
