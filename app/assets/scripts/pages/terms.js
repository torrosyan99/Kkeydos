const links = document.querySelectorAll('[data-terms-link]');
const sections = document.querySelectorAll('[data-terms-section]');
const select = document.querySelector('[data-terms-select]');
const current = select.querySelector('[data-select-button-value]');
const trigger = select.querySelector('.select__button');
const mobile = window.matchMedia('(width < 48rem)');
let currentId = '';

function updateCurrent() {
  const offset = parseFloat(getComputedStyle(sections[0]).scrollMarginTop);
  let active = sections[0];

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= offset + 1) active = section;
  });

  if (active.id === currentId) return;
  currentId = active.id;

  links.forEach((link) => {
    if (link.hash === `#${currentId}`) {
      link.setAttribute('aria-current', 'location');
      current.textContent = link.textContent.trim();
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

document.addEventListener('scroll', updateCurrent, { passive: true });
mobile.addEventListener('change', () => {
  if (trigger.ariaExpanded === 'true') trigger.click();
  updateCurrent();
});
updateCurrent();
