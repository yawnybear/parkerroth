// Wires prev/next buttons to each [data-carousel] row and disables them at the ends.
const SCROLL_TOLERANCE = 2

function setupCarousel(carousel) {
  const track = carousel.querySelector('[data-carousel-track]')
  const prev = carousel.querySelector('[data-carousel-prev]')
  const next = carousel.querySelector('[data-carousel-next]')
  if (!track || !prev || !next) return

  const update = () => {
    const maxScroll = track.scrollWidth - track.clientWidth
    prev.disabled = track.scrollLeft <= SCROLL_TOLERANCE
    next.disabled = track.scrollLeft >= maxScroll - SCROLL_TOLERANCE
  }

  const step = () => {
    const item = track.querySelector('.carousel__item')
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    return item ? item.getBoundingClientRect().width + gap : track.clientWidth
  }

  prev.addEventListener('click', () => track.scrollBy({ left: -step() }))
  next.addEventListener('click', () => track.scrollBy({ left: step() }))
  track.addEventListener('scroll', update, { passive: true })
  new ResizeObserver(update).observe(track)
  update()
}

document.querySelectorAll('[data-carousel]').forEach(setupCarousel)
