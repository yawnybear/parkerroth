// Makes selecting a side-panel nav item one continuous motion (see nav-item.css):
// on click the item keeps the "selecting" state (outline closes into a solid line, then
// it settles back to its original size with a beige fill) instead of snapping back to
// its hover state on mouseup, and navigation waits for that motion to finish so the
// page change starts from exactly what the next page shows.
;(() => {
  const nav = document.querySelector('.side-panel__footer')
  if (!nav) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  nav.addEventListener('click', event => {
    const item = event.target.closest('a.nav-item')
    if (!item || item.classList.contains('nav-item--selecting')) return
    // Leave new-tab / download / modified clicks to the browser
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (item.target && item.target !== '_self') return

    item.classList.add('nav-item--selecting')
    if (reducedMotion.matches) return // navigate right away

    event.preventDefault()
    const go = () => { window.location.href = item.href }
    const duration = motionDuration(item)
    if (!duration) return go()

    let done = false
    const finish = () => { if (!done) { done = true; go() } }
    item.addEventListener('transitionend', e => { if (e.target === item && e.propertyName === 'transform') finish() })
    setTimeout(finish, duration + 60) // in case there was no transform change to wait for
  })

  // Restored from the back/forward cache: drop the leftover state
  window.addEventListener('pageshow', event => {
    if (event.persisted) nav.querySelectorAll('.nav-item--selecting').forEach(i => i.classList.remove('nav-item--selecting'))
  })

  // Longest delay + duration among the item's transitions (the settle step ends last)
  function motionDuration(item) {
    const toMs = t => parseFloat(t) * (t.trim().endsWith('ms') ? 1 : 1000)
    const cs = getComputedStyle(item)
    const durations = cs.transitionDuration.split(',').map(toMs)
    const delays = cs.transitionDelay.split(',').map(toMs)
    return Math.max(0, ...durations.map((d, i) => d + (delays[i % delays.length] || 0)))
  }
})()
