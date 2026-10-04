export function fixedBlock(
  fixedSelector,
  contentSelector,
  { topPosition = 80, onChange = () => {}, trackDirection = false } = {},
) {
  const fixed = document.querySelector(fixedSelector);
  const content = document.querySelector(contentSelector);

  if (!fixed || !content) return;

  let wasFixed;
  let lastScrollY = window.scrollY;

  function updateHeight() {
    if (!wasFixed) {
      fixed.style.height = `${content.getBoundingClientRect().height}px`;
    }
  }

  function update() {
    if (trackDirection) {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        content.dataset.scrollDirection = 'down';
      } else if (currentScrollY < lastScrollY) {
        content.dataset.scrollDirection = 'up';
      }

      lastScrollY = currentScrollY;
    }

    const isFixed = window.scrollY > 0 && fixed.getBoundingClientRect().top < topPosition;

    if (isFixed === wasFixed) return;

    updateHeight();

    wasFixed = isFixed;
    content.dataset.fixed = String(isFixed);

    onChange(isFixed);

    updateHeight();
  }

  new ResizeObserver(updateHeight).observe(content, {
    box: 'border-box',
  });

  window.addEventListener('scroll', update, {
    passive: true,
  });

  window.addEventListener('resize', update);

  update();
}
