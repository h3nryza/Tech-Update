// Dark/Light theme management
window.initTheme = function() {
  var stored = localStorage.getItem('theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    return 'dark';
  }
  document.documentElement.classList.remove('dark');
  return 'light';
};

window.toggleThemeMode = function() {
  var isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  return isDark ? 'dark' : 'light';
};
