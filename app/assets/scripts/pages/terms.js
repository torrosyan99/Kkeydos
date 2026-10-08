const menu = document.querySelector('[data-terms-menu]');
const sections = document.querySelectorAll('[data-terms-section]');

if (menu && sections.length) {
  const links = menu.querySelectorAll('[data-terms-link]');
  const toc = menu.querySelector('[data-terms-toc]');
  const current = menu.querySelector('[data-select-button-value]');
  const trigger = menu.querySelector('.select__button');
  const mobile = window.matchMedia('(width < 768px)');
  let currentId = '';
  let scheduled = false;

  function keepCurrentVisible() {
    if (!toc || mobile.matches) return;
    const activeLink = toc.querySelector('[aria-current="location"]');
    if (!activeLink) return;

    const navBounds = toc.getBoundingClientRect();
    const linkBounds = activeLink.getBoundingClientRect();
    if (linkBounds.top >= navBounds.top + 16 && linkBounds.bottom <= navBounds.bottom - 16) return;

    const linkTop = linkBounds.top - navBounds.top + toc.scrollTop;
    toc.scrollTo({
      top: linkTop - toc.clientHeight / 2 + linkBounds.height / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  function updateCurrent() {
    scheduled = false;
    const offset = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0;
    let active = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= offset + 1) active = section;
    });

    if (active.id !== currentId) {
      currentId = active.id;
      links.forEach((link) => {
        if (link.hash === '#' + currentId) {
          link.setAttribute('aria-current', 'location');
          if (current) current.textContent = link.textContent.trim();
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }
    keepCurrentVisible();
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateCurrent);
  }

  document.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);
  mobile.addEventListener('change', () => {
    if (trigger?.ariaExpanded === 'true') trigger.click();
    scheduleUpdate();
  });
  updateCurrent();
}
