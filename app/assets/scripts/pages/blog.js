import { fixedBlock } from '../../libs/fixedBlock/fixedBlock.js';
import { initToggleGroup } from '../../libs/initToggleGroup/initToggleGroup.js';

initToggleGroup({
  itemSelector: 'data-blog-menu',
  triggerSelector: 'data-blog-trigger',
});

document.querySelectorAll('[data-blog-menu] a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const menu = link.closest('[data-blog-menu]');
    menu.dataset.open = 'false';
    menu.querySelector('[data-blog-trigger]')?.setAttribute('aria-expanded', 'false');
  });
});

fixedBlock('[data-fixed]', '[data-fixed-content]', {
  trackDirection: true,
});
