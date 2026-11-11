// Deferred button setup; the inline head script applies the theme before first paint.
(() => {
  const KEY = 'kosha-theme', root = document.documentElement;
  const button = document.createElement('button'), icon = document.createElement('span'), label = document.createElement('span');
  button.type = 'button'; button.className = 'secondary theme-toggle';
  icon.setAttribute('aria-hidden', 'true'); button.append(icon, label);
  // The button names the theme it switches to, so its visible text is also its accessible name.
  const show = () => {
    const dark = root.dataset.theme === 'dark';
    icon.textContent = dark ? '☀ ' : '☾ '; label.textContent = dark ? 'Light mode' : 'Dark mode';
  };
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, root.dataset.theme); } catch {}
    show();
  });
  show();
  document.querySelector('header').append(button);
})();
