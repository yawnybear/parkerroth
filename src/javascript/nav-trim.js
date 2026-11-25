// Plays the active nav item's trim-on stroke animation (see nav-item.css) only when the
// active item differs from the previous page's, e.g. after choosing a new section, and
// on the first visit. Opening a card within the same section doesn't replay it.
// Loaded synchronously right after the nav markup so the class is set before first paint.
;(() => {
  const KEY = 'pr-nav-active'
  const active = document.querySelector('.side-panel .nav-item--active')
  if (!active) return
  const current = active.getAttribute('href')
  let previous = null
  try {
    previous = sessionStorage.getItem(KEY)
    sessionStorage.setItem(KEY, current)
  } catch {}
  if (previous !== current) {
    setTrimOrigin(active)
    active.classList.add('nav-item--trim-in')
    // Back to the plain (undashed) stroke once drawn
    active.querySelector('.nav-item__trim-path')?.addEventListener('animationend', () => {
      active.classList.remove('nav-item--trim-in')
    }, { once: true })
  }

  // Fraction of the rounded rect's perimeter, measured clockwise from its path start
  // (the top edge, just after the top-left corner), at which the middle of the left
  // edge sits. The trim-on animation grows a dash outward from that point.
  function setTrimOrigin(item) {
    const rect = item.querySelector('.nav-item__trim-path')
    if (!rect) return
    try {
      const { width: w, height: h } = rect.getBBox()
      const r = Math.min(parseFloat(getComputedStyle(rect).rx) || 0, w / 2, h / 2)
      const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r
      if (!perimeter) return
      const backFromEnd = (Math.PI * r) / 2 + (h - 2 * r) / 2
      item.style.setProperty('--_nav-item-trim-origin', (1 - backFromEnd / perimeter).toFixed(4))
    } catch {}
  }
})()
