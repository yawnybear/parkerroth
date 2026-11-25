// Side-panel nav behaviour (see nav-item.css). Loaded synchronously right after the nav
// markup, so classes are set before the first paint.
//
// 1. Trim-on: plays the active item's solid-outline animation only when the active item
//    differs from the previous page's (choosing a new section, or the first visit).
//    Opening a card within the same section doesn't replay it.
// 2. Held hover: a new page doesn't apply :hover until the mouse moves, so a clicked item
//    would snap back from its hover state while the page changes. The pressed item is
//    remembered and given .nav-item--hover-held on the next page until the pointer
//    leaves it.
;(() => {
  const ACTIVE_KEY = 'pr-nav-active'
  const HELD_KEY = 'pr-nav-held'
  const nav = document.querySelector('.side-panel__footer')
  if (!nav) return

  const store = {
    get: key => { try { return sessionStorage.getItem(key) } catch { return null } },
    set: (key, value) => { try { sessionStorage.setItem(key, value) } catch {} },
    take: key => { try { const v = sessionStorage.getItem(key); sessionStorage.removeItem(key); return v } catch { return null } },
  }

  // --- 1. Trim-on for a newly selected item ---------------------------------------
  const active = nav.querySelector('.nav-item--active')
  if (active) {
    const current = active.getAttribute('href')
    const previous = store.get(ACTIVE_KEY)
    store.set(ACTIVE_KEY, current)
    if (previous !== current) {
      setTrimOrigin(active)
      active.classList.add('nav-item--trim-in')
      // Back to the plain (undashed) stroke once drawn
      active.querySelector('.nav-item__outline-path--selected')?.addEventListener('animationend', () => {
        active.classList.remove('nav-item--trim-in')
      }, { once: true })
    }
  }

  // --- 2. Held hover ----------------------------------------------------------------
  const heldHref = store.take(HELD_KEY)
  const held = heldHref && [...nav.querySelectorAll('.nav-item')].find(a => a.getAttribute('href') === heldHref)
  if (held) {
    held.classList.add('nav-item--hover-held')
    const release = () => {
      held.classList.remove('nav-item--hover-held')
      held.removeEventListener('pointerleave', release)
      document.removeEventListener('pointermove', checkFirstMove)
    }
    // Real hover takes over on the first pointer move; release then if we're not over it
    const checkFirstMove = () => {
      document.removeEventListener('pointermove', checkFirstMove)
      if (!held.matches(':hover')) release()
    }
    held.addEventListener('pointerleave', release)
    document.addEventListener('pointermove', checkFirstMove)
  }

  // Remember a pointer-pressed item for the next page (keyboard selection isn't held)
  nav.addEventListener('pointerdown', event => {
    const item = event.target.closest('.nav-item')
    if (item && event.pointerType !== 'touch') store.set(HELD_KEY, item.getAttribute('href'))
  })

  // Fraction of the rounded rect's perimeter, measured clockwise from its path start
  // (the top edge, just after the top-left corner), at which the middle of the left
  // edge sits. The trim-on animation grows a dash outward from that point.
  function setTrimOrigin(item) {
    const rect = item.querySelector('.nav-item__outline-path--selected')
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
