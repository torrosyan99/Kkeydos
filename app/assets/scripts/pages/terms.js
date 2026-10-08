const menu = document.querySelector('[data-terms-menu]');
const sections = document.querySelectorAll('[data-terms-section]');

if (menu && sections.length) {
  const links = menu.querySelectorAll('[data-terms-link]');
  const current = menu.querySelector('[data-select-button-value]');
  let currentId = '';
  let pendingId = '';
  let pendingTimer;
  let scheduled = false;

  function setCurrent(id) {
    if (id === currentId) return;
    currentId = id;
    links.forEach((link) => {
      if (link.hash === `#${id}`) {
        link.setAttribute('aria-current', 'location');
        if (current) current.textContent = link.textContent.trim();
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateCurrent() {
    scheduled = false;
    const offset = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0;
    let active = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= offset + 1) active = section;
    });

    if (pendingId && active.id !== pendingId) return;
    if (pendingId) {
      pendingId = '';
      clearTimeout(pendingTimer);
    }
    setCurrent(active.id);
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateCurrent);
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.hash.slice(1);
      if (!id || !document.getElementById(id)) return;
      pendingId = id;
      setCurrent(id);
      clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => {
        pendingId = '';
        scheduleUpdate();
      }, 1500);
    });
  });

  document.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  updateCurrent();
}
