// Search and filter utilities

// Build searchable string for an item (cached on item._searchable)
function buildSearchable(item) {
  if (item._searchable) return item._searchable;
  var dateStr = '';
  if (item.published) {
    var d = new Date(item.published);
    dateStr = item.published.slice(0, 10) + ' ' +
              d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
              d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  item._searchable = (item.title + ' ' + item.tldr + ' ' + item.source_name + ' ' + item.tags.join(' ') + ' ' + dateStr).toLowerCase();
  return item._searchable;
}

// Check if a single term matches an item
function termMatches(item, term) {
  if (term.startsWith('#')) {
    return item.tags.some(function(t) { return t.toLowerCase() === term; });
  }
  return buildSearchable(item).indexOf(term) !== -1;
}

// Simple search (all terms must match = AND)
window.searchItems = function(items, query) {
  if (!query || !query.trim()) return items;
  var terms = query.toLowerCase().trim().split(/\s+/);
  return items.filter(function(item) {
    return terms.every(function(term) { return termMatches(item, term); });
  });
};

// Match a value against a target using an operator
function matchOperator(target, val, operator) {
  if (!target) target = '';
  target = target.toLowerCase();
  val = val.toLowerCase();

  switch (operator) {
    case 'equals':
      return target === val;
    case 'starts_with':
      return target.indexOf(val) === 0;
    case 'ends_with':
      return target.length >= val.length && target.slice(-val.length) === val;
    case 'regex':
      try { return new RegExp(val, 'i').test(target); } catch(e) { return false; }
    case 'not_contains':
      return target.indexOf(val) === -1;
    case 'contains':
    default:
      return target.indexOf(val) !== -1;
  }
}

// Get the field value from an item for comparison
function getFieldValue(item, field) {
  switch (field) {
    case 'tag':
      return item.tags.join(' ');
    case 'title':
      return item.title || '';
    case 'tldr':
      return item.tldr || '';
    case 'source':
      return item.source_name || '';
    case 'date':
      if (!item.published) return '';
      var d = new Date(item.published);
      return item.published.slice(0, 10) + ' ' +
        d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
    default: // 'any'
      return buildSearchable(item);
  }
}

// Advanced search with AND/OR conditions
// conditions = [{ field, value, operator, negate }]
// logic = 'AND' | 'OR'
window.advancedSearchItems = function(items, conditions, logic) {
  if (!conditions || conditions.length === 0) return items;

  return items.filter(function(item) {
    var results = conditions.map(function(cond) {
      if (!cond.value || !cond.value.trim()) return true;
      var val = cond.value.trim();
      var op = cond.operator || 'contains';
      var match = false;

      if (cond.field === 'tag' && (op === 'equals' || op === 'contains')) {
        // Special handling: match individual tags
        match = item.tags.some(function(t) {
          return matchOperator(t, val, op);
        });
      } else {
        var target = getFieldValue(item, cond.field);
        match = matchOperator(target, val, op);
      }

      return cond.negate ? !match : match;
    });

    if (logic === 'OR') {
      return results.some(function(r) { return r; });
    }
    return results.every(function(r) { return r; }); // AND
  });
};

window.filterByDateRange = function(items, startDate, endDate) {
  if (!startDate && !endDate) return items;
  return items.filter(function(item) {
    var d = new Date(item.published);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });
};

window.getDatePreset = function(preset) {
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var start, end;

  switch (preset) {
    case 'today':
      start = today;
      end = today;
      break;
    case 'yesterday':
      start = new Date(today);
      start.setDate(today.getDate() - 1);
      end = new Date(start);
      break;
    case 'this-week':
      var day = today.getDay();
      start = new Date(today);
      start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      end = today;
      break;
    case 'last-week':
      var day2 = today.getDay();
      end = new Date(today);
      end.setDate(today.getDate() - (day2 === 0 ? 7 : day2));
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      break;
    case 'last-30':
      start = new Date(today);
      start.setDate(today.getDate() - 30);
      end = today;
      break;
    case 'last-90':
      start = new Date(today);
      start.setDate(today.getDate() - 90);
      end = today;
      break;
    default:
      return { start: null, end: null };
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

window.sortItems = function(items, column, direction) {
  return items.slice().sort(function(a, b) {
    var aVal = a[column];
    var bVal = b[column];

    if (column === 'published') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (column === 'views') {
      aVal = aVal || 0;
      bVal = bVal || 0;
    } else if (column === 'version') {
      // Version sort: compare semver-like strings
      aVal = (aVal || '0').replace(/[^0-9.]/g, '');
      bVal = (bVal || '0').replace(/[^0-9.]/g, '');
      var aParts = aVal.split('.').map(Number);
      var bParts = bVal.split('.').map(Number);
      for (var i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        var av = aParts[i] || 0, bv = bParts[i] || 0;
        if (av !== bv) { aVal = av; bVal = bv; break; }
      }
    } else if (column === 'tags') {
      // Sort by first # tag alphabetically
      var aTag = (aVal || []).filter(function(t) { return t.startsWith('#'); }).sort().join(',');
      var bTag = (bVal || []).filter(function(t) { return t.startsWith('#'); }).sort().join(',');
      aVal = aTag;
      bVal = bTag;
    } else {
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Column-level include/exclude filter
// filters = [{ column, value, mode: 'include'|'exclude', operator }]
window.applyColumnFilters = function(items, filters) {
  if (!filters || filters.length === 0) return items;

  return items.filter(function(item) {
    return filters.every(function(f) {
      if (!f.value || !f.value.trim()) return true;
      var val = f.value.trim();
      var op = f.operator || 'contains';
      var fieldMap = { source_name: 'source', published: 'date', tags: 'tag' };
      var field = fieldMap[f.column] || f.column;
      var target = getFieldValue(item, field);
      var match;

      if (f.column === 'tags' && (op === 'equals' || op === 'contains')) {
        match = item.tags.some(function(t) { return matchOperator(t, val, op); });
      } else {
        match = matchOperator(target, val, op);
      }

      return f.mode === 'exclude' ? !match : match;
    });
  });
};
