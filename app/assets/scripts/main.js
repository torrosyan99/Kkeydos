import '../libs/text-rotator/text-rotator.js';
import { marquee } from '../libs/vanilla-marquee/vanilla-marquee.js';

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

/* Marquee */
document.querySelectorAll('[data-marquee]').forEach((element) => {
  const gap = Number(element.dataset.marqueeGap);
  const speed = Number(element.dataset.marqueeSpeed);

  new marquee(element, {
    direction: element.dataset.marqueeDirection || 'left',

    duplicated:
      element.dataset.marqueeDuplicated === undefined
        ? true
        : element.dataset.marqueeDuplicated === 'true' || element.dataset.marqueeDuplicated === '',

    gap: Number.isFinite(gap) ? gap : 12,
    speed: Number.isFinite(speed) ? speed : 40,

    pauseOnHover:
      element.dataset.marqueePauseOnHover === undefined
        ? true
        : element.dataset.marqueePauseOnHover === 'true' ||
          element.dataset.marqueePauseOnHover === '',

    startVisible:
      element.dataset.marqueeStartVisible === undefined
        ? true
        : element.dataset.marqueeStartVisible === 'true' ||
          element.dataset.marqueeStartVisible === '',
  });
});

function initToggleGroup({ containerSelector, itemSelector, triggerSelector }) {
  document.querySelectorAll(`[${containerSelector}]`).forEach((container) => {
    const oneActive = container.dataset[containerSelector.replace('data-', '')] === 'one-active';
    const items = container.querySelectorAll(`[${itemSelector}]`);

    items.forEach((item) => {
      const trigger = item.querySelector(`[${triggerSelector}]`);

      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.dataset.open === 'true';

        if (oneActive && !isOpen) {
          items.forEach((otherItem) => {
            otherItem.dataset.open = 'false';

            otherItem.querySelector(`[${triggerSelector}]`)?.setAttribute('aria-expanded', 'false');
          });
        }

        item.dataset.open = String(!isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  });
}

initToggleGroup({
  containerSelector: 'data-accordions',
  itemSelector: 'data-accordion',
  triggerSelector: 'data-accordion-trigger',
});

initToggleGroup({
  containerSelector: 'data-cards',
  itemSelector: 'data-card',
  triggerSelector: 'data-card-trigger',
});
