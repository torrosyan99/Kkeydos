const header = document.querySelector('#header');
const menuButton = document.querySelector('#menu-button');

if (header && menuButton) {
  menuButton.addEventListener('click', (e) => {
    const open = !(header.dataset.open === 'true')

    header.dataset.open = String(open)
    menuButton.setAttribute('aria-expanded', String(open))
    document.body.classList.toggle('h-screen', open)
  })
}

document.querySelectorAll('[data-accordion]').forEach((details) => {
  const summary = details.querySelector('summary')
  const content = details.querySelector('[data-accordion-content]')

  if (!summary || !content) return

  let animation = null

  summary.addEventListener('click', (e) => {
    e.preventDefault()

    animation?.cancel()

    if (details.open) {
      close()
    } else {
      open()
    }
  })

  function open() {
    details.open = true

    const startHeight = `${summary.offsetHeight}px`
    const endHeight = `${summary.offsetHeight + content.offsetHeight}px`

    animation = details.animate(
      {
        height: [startHeight, endHeight],
      },
      {
        duration: 400,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    )

    animation.onfinish = () => {
      details.style.height = ''
      animation = null
    }
  }

  function close() {
    const startHeight = `${details.offsetHeight}px`
    const endHeight = `${summary.offsetHeight}px`

    animation = details.animate(
      {
        height: [startHeight, endHeight],
      },
      {
        duration: 400,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    )

    animation.onfinish = () => {
      details.open = false
      details.style.height = ''
      animation = null
    }
  }
})