// Export utilities for CSV, JSON, and PDF
window.exportCSV = function(items, filename) {
  var headers = ['Date', 'Title', 'Source', 'URL', 'TLDR', 'Tags', 'Type', 'Views'];
  var rows = items.map(function(item) {
    return [
      new Date(item.published).toLocaleDateString(),
      '"' + (item.title || '').replace(/"/g, '""') + '"',
      '"' + (item.source_name || '').replace(/"/g, '""') + '"',
      item.url,
      '"' + (item.tldr || '').replace(/"/g, '""') + '"',
      '"' + item.tags.join(', ') + '"',
      item.type,
      item.views || '',
    ];
  });

  var csv = [headers.join(',')].concat(rows.map(function(r) { return r.join(','); })).join('\n');
  downloadFile(csv, filename + '.csv', 'text/csv');
};

window.exportJSON = function(items, filename) {
  var json = JSON.stringify({ exported: new Date().toISOString(), total: items.length, items: items }, null, 2);
  downloadFile(json, filename + '.json', 'application/json');
};

window.exportPDF = function(items, filename, title) {
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.text(title || 'Tech Update Report', 14, 15);
  doc.setFontSize(10);
  doc.text('Generated: ' + new Date().toLocaleString() + '  |  Items: ' + items.length, 14, 22);

  var tableData = items.map(function(item) {
    return [
      new Date(item.published).toLocaleDateString(),
      item.title.slice(0, 60) + (item.title.length > 60 ? '...' : ''),
      item.source_name,
      (item.tldr || '').slice(0, 80) + ((item.tldr || '').length > 80 ? '...' : ''),
      item.tags.filter(function(t) { return t.startsWith('#'); }).join(', '),
      item.views ? item.views.toLocaleString() : '-',
    ];
  });

  doc.autoTable({
    head: [['Date', 'Title', 'Source', 'TLDR', 'Tags', 'Views']],
    body: tableData,
    startY: 28,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 55 },
      2: { cellWidth: 30 },
      3: { cellWidth: 80 },
      4: { cellWidth: 35 },
      5: { cellWidth: 18 },
    },
  });

  doc.save(filename + '.pdf');
};

function downloadFile(content, filename, mimeType) {
  var blob = new Blob([content], { type: mimeType });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
