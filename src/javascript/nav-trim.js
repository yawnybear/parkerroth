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
  if (previous !== current) active.classList.add('nav-item--trim-in')
})()
