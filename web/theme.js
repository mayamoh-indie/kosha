// Light/dark theme. Loaded in <head> without `defer` so the saved theme applies before the page paints.
// The choice is kept in this browser only; with no saved choice the system setting is followed.
(() => {
  const KEY = 'kosha-theme', root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  root.dataset.theme = saved === 'dark' || saved === 'light' ? saved
    : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  document.addEventListener('DOMContentLoaded', () => {
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
  });
})();
