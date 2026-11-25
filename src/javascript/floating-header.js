// Adds content-header--floating to a sticky header while it is stuck to the top of its
// scroll container, so it can render as a floating bar (see content-header.css).
const STUCK_TOLERANCE = 1

function scrollParent(el) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
  }
  return document.scrollingElement
}

function setupFloatingHeader(header) {
  const scroller = scrollParent(header)
  const target = scroller === document.scrollingElement ? window : scroller

  const update = () => {
    const stickyTop = parseFloat(getComputedStyle(header).insetBlockStart) || 0
    const scrollerTop = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top
    const stuck = scroller.scrollTop > 0 &&
      header.getBoundingClientRect().top <= scrollerTop + stickyTop + STUCK_TOLERANCE
    header.classList.toggle('content-header--floating', stuck)
  }

  target.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
  update()
}

document.querySelectorAll('[data-floating-header]').forEach(setupFloatingHeader)
