const main = document.querySelector('main');
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
svg.classList.add(
  'absolute',
  'left-0',
  'z-1',
  'block',
  'overflow-visible',
  'text-[#fbb39e]',
  'pointer-events-none',
  '[&[hidden]]:hidden',
  'max-md:hidden',
);
svg.setAttribute('aria-hidden', 'true');
svg.setAttribute('focusable', 'false');
svg.setAttribute('hidden', '');
path.setAttribute('fill', 'none');
path.setAttribute('stroke', 'currentColor');
path.setAttribute('stroke-width', '8');
dot.setAttribute('r', '16');
dot.setAttribute('fill', 'currentColor');
svg.append(path, dot);
main.append(svg);

const desktop = window.matchMedia('(min-width: 768px)');
let frame = 0;

function draw() {
  frame = 0;
  const start = main.querySelector('[data-case-flow-start]');
  const target = main.querySelector('[data-case-flow-end]');
  const turn = main.querySelector('[data-case-flow-turn]');
  if (!desktop.matches || !start || !target) {
    svg.setAttribute('hidden', '');
    return;
  }

  const bounds = main.getBoundingClientRect();
  const startBounds = start.getBoundingClientRect();
  const targetBounds = target.getBoundingClientRect();
  const formBounds = (target.querySelector('form') || target).getBoundingClientRect();
  const top = startBounds.top - bounds.top + 28;
  const left = startBounds.left - bounds.left + 4;
  const right = startBounds.right - bounds.left - 4;
  const endX = targetBounds.right - bounds.left + 24;
  const endY = formBounds.top - bounds.top + formBounds.height / 2 - top;

  if (!startBounds.width || !targetBounds.height || endY <= 0 || endX >= right) {
    svg.setAttribute('hidden', '');
    return;
  }

  const turnBounds = turn?.getBoundingClientRect();
  const turnY = turnBounds ? turnBounds.top - bounds.top + turnBounds.height / 2 - top : 0;
  const hasTurn = turnBounds?.height > 0 && turnY > 0 && turnY < endY;
  const radius = Math.min(56, (right - left) / 4, hasTurn ? turnY / 2 : endY / 2);
  const endRadius = Math.min(56, right - endX, (endY - (hasTurn ? turnY : 0)) / 2);
  let route;

  if (hasTurn) {
    const turnRadius = Math.min(radius, (endY - turnY) / 2);
    route = [
      'M',
      left + 60,
      0,
      'H',
      left + radius,
      'Q',
      left,
      0,
      left,
      radius,
      'V',
      turnY - turnRadius,
      'Q',
      left,
      turnY,
      left + turnRadius,
      turnY,
      'H',
      right - turnRadius,
      'Q',
      right,
      turnY,
      right,
      turnY + turnRadius,
    ];
  } else {
    // Without a crossover, keep the entire route in the right-hand gutter.
    route = ['M', right - 60, 0, 'H', right - radius, 'Q', right, 0, right, radius];
  }

  route.push('V', endY - endRadius, 'Q', right, endY, right - endRadius, endY, 'H', endX);
  path.setAttribute('d', route.join(' '));
  dot.setAttribute('cx', endX);
  dot.setAttribute('cy', endY);
  const height = endY + 20;
  svg.setAttribute('viewBox', '0 0 ' + bounds.width + ' ' + height);
  svg.setAttribute('width', bounds.width);
  svg.setAttribute('height', height);
  svg.style.top = top + 'px';
  svg.removeAttribute('hidden');
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(draw);
}

const resizeObserver = new ResizeObserver(schedule);

function observeLayout() {
  resizeObserver.disconnect();
  const elements = new Set([
    main,
    ...main.children,
    ...main.querySelectorAll(
      '[data-case-flow-start], [data-case-flow-turn], [data-case-flow-end], [data-case-flow-end] form',
    ),
  ]);
  elements.forEach((element) => {
    if (element !== svg) resizeObserver.observe(element);
  });
}

observeLayout();

window.addEventListener('resize', schedule);
main.addEventListener('load', schedule, true);
desktop.addEventListener('change', schedule);
