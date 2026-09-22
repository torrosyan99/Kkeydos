const header = document.querySelector('#header');
const menuButton = document.querySelector('#menu-button');

if (header && menuButton) {
  menuButton.addEventListener('click', (e) => {
    const open = !(header.dataset.open === 'true');

    header.dataset.open = String(open);
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('h-screen', open);
  });
}

document.querySelectorAll('[data-accordions]').forEach((accordions) => {
  const oneActive = accordions.dataset.accordions === 'one-active';
  const items = accordions.querySelectorAll('[data-accordion]');

  items.forEach((accordion) => {
    const trigger = accordion.querySelector('[data-accordion-trigger]');

    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = accordion.dataset.open === 'true';

      if (oneActive && !isOpen) {
        items.forEach((item) => {
          item.dataset.open = 'false';

          item.querySelector('[data-accordion-trigger]')?.setAttribute('aria-expanded', 'false');
        });
      }

      const open = !isOpen;

      accordion.dataset.open = String(open);
      trigger.setAttribute('aria-expanded', String(open));
    });
  });
});
