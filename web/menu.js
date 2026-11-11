// Phone menu. At phone width the sidebar is a slim top bar; this adds the button that opens its links
// as a slide-out panel. The stylesheet shows the button only at phone width, so desktop is unchanged.
(() => {
  const sidebar = document.querySelector('.sidebar'), button = document.createElement('button'), backdrop = document.createElement('div');
  const phone = matchMedia('(max-width:600px)');
  sidebar.id = 'site-menu';
  button.type = 'button'; button.className = 'menu-toggle'; button.setAttribute('aria-controls', sidebar.id);
  backdrop.className = 'menu-backdrop';
  const isOpen = () => document.body.classList.contains('menu-open');
  function set(open) {
    // The open panel leaves the page flow; reserve the bar's height so the page behind does not jump.
    if (open) document.body.style.setProperty('--menu-bar', `${sidebar.offsetHeight}px`);
    document.body.classList.toggle('menu-open', open);
    document.querySelector('main').inert = open;  // keeps keyboard focus out of the page behind the open menu
    button.textContent = open ? '✕' : '☰';
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    button.setAttribute('aria-expanded', String(open));
  }
  button.addEventListener('click', () => set(!isOpen()));
  backdrop.addEventListener('click', () => set(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && isOpen()) { set(false); button.focus(); } });
  phone.addEventListener('change', () => set(false));
  sidebar.querySelector('.brand').after(button); sidebar.after(backdrop);
  set(false);
})();
