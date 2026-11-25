// Pairs the clicked card with the detail page's body for the cross-document view
// transition (see page-transitions.css). The detail body is always named
// "project-detail"; on a listing page the matching card is given that name just for
// the transition. Naming on demand avoids duplicate names on pages where many links
// share a destination (e.g. the photo grid), which would cancel the transition.
//
// Also scrolls a listing back to the top before opening a page from it (see below).
//
// Loaded in <head> without defer so the listeners exist before the first render;
// <link rel="expect" ... blocking="render"> keeps that render waiting for the DOM.
;(() => {
  const NAME = 'project-detail'
  const CARD_SELECTOR = 'a.card, a.media-grid__link'
  // Set when navigating away from a detail page, read by the next page to tag the
  // transition as an exit (styled snappier in page-transitions.css)
  const EXIT_FLAG = 'pr-vt-exit-detail'
  const EXIT_TYPE = 'exit-detail'

  const storage = {
    set: () => { try { sessionStorage.setItem(EXIT_FLAG, '1') } catch {} },
    take: () => {
      try {
        const value = sessionStorage.getItem(EXIT_FLAG)
        sessionStorage.removeItem(EXIT_FLAG)
        return value === '1'
      } catch { return false }
    },
  }

  const samePage = (a, b) => {
    try { return new URL(a, location.href).pathname === new URL(b, location.href).pathname } catch { return false }
  }

  const clearNames = () => {
    document.querySelectorAll('[data-vt-named]').forEach(el => {
      el.style.viewTransitionName = ''
      delete el.dataset.vtNamed
    })
  }

  const name = el => {
    el.style.viewTransitionName = NAME
    el.dataset.vtNamed = ''
  }

  const cardFor = url => [...document.querySelectorAll(CARD_SELECTOR)].find(a => samePage(a.href, url))

  // Leaving this page: name the card being opened
  window.addEventListener('pageswap', event => {
    clearNames()
    const to = event.activation?.entry?.url
    if (!event.viewTransition || !to) return
    if (document.querySelector('.project-detail__body')) storage.set()
    const card = cardFor(to)
    if (card) name(card)
  })

  // Arriving on this page: name the card we came back from
  window.addEventListener('pagereveal', event => {
    clearNames()
    const exiting = storage.take()
    const from = navigation?.activation?.from?.url
    if (!event.viewTransition || !from) return
    if (exiting) event.viewTransition.types?.add(EXIT_TYPE)
    const card = cardFor(from)
    if (!card) return
    name(card)
    event.viewTransition.finished.finally(clearNames)
  })

  // Opening a page from a listing while scrolled down: glide back to the top first, so
  // the floating header settles back into place before the page changes (the card then
  // morphs from where it ends up). Detail-page images are handled in place by
  // image-viewer.js, which prevents the default before this runs.
  const SCROLL_WAIT_MAX = 700
  document.addEventListener('click', event => {
    const link = event.target.closest(CARD_SELECTOR)
    if (!link || event.defaultPrevented) return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if ((link.target && link.target !== '_self') || samePage(link.href, location.href)) return

    const scroller = link.closest('.app-body')
    if (!scroller || scroller.scrollTop <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    event.preventDefault()
    let done = false
    const go = () => { if (!done) { done = true; location.href = link.href } }
    scroller.addEventListener('scrollend', go, { once: true })
    setTimeout(go, SCROLL_WAIT_MAX)
    scroller.scrollTo({ top: 0, behavior: 'smooth' })
  })
})()
