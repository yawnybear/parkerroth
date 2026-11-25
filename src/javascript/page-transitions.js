// Pairs the clicked card with the detail page's body for the cross-document view
// transition (see page-transitions.css). The detail body is always named
// "project-detail"; on a listing page the matching card is given that name just for
// the transition. Naming on demand avoids duplicate names on pages where many links
// share a destination (e.g. the photo grid), which would cancel the transition.
//
// Also remembers a listing's scroll position for when you close back to it (see below).
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
    restoreListingPosition()
    const exiting = storage.take()
    const from = navigation?.activation?.from?.url
    if (!event.viewTransition || !from) return
    if (exiting) event.viewTransition.types?.add(EXIT_TYPE)
    const card = cardFor(from)
    if (!card) return
    name(card)
    event.viewTransition.finished.finally(clearNames)
  })

  // --- Remember where you were on a listing ---------------------------------------
  // Leaving a listing saves its scroll position (page + each row's sideways scroll).
  // Closing a detail page back to it (the X or the category crumb), or going back /
  // forward to it, restores that position before the first render, so the reverse
  // morph lands on the card you opened. Other arrivals (e.g. the side nav) start at
  // the top.
  const POSITION_PREFIX = 'pr-listing-position:'
  const RETURN_FLAG = 'pr-listing-return'
  const isListing = () => !document.querySelector('.project-detail__body') && !!document.querySelector('.page-content')
  const scrollerOf = () => document.querySelector('.app-body')
  const session = {
    get: key => { try { return sessionStorage.getItem(key) } catch { return null } },
    set: (key, value) => { try { sessionStorage.setItem(key, value) } catch {} },
    take: key => { try { const v = sessionStorage.getItem(key); sessionStorage.removeItem(key); return v } catch { return null } },
  }

  const saveListingPosition = () => {
    const scroller = scrollerOf()
    if (!isListing() || !scroller) return
    const tracks = [...document.querySelectorAll('[data-carousel-track]')].map(t => Math.round(t.scrollLeft))
    session.set(POSITION_PREFIX + location.pathname, JSON.stringify({ top: Math.round(scroller.scrollTop), tracks }))
  }
  window.addEventListener('pageswap', saveListingPosition)
  window.addEventListener('pagehide', saveListingPosition)

  // On a detail page, closing via the X or the category crumb marks a return
  document.addEventListener('click', event => {
    const link = event.target.closest('.project-detail .content-header a')
    if (!link || event.defaultPrevented) return
    session.set(RETURN_FLAG, new URL(link.href, location.href).pathname)
  })

  let restored = false
  function restoreListingPosition() {
    if (restored) return
    restored = true
    const returning = session.take(RETURN_FLAG) === location.pathname
    const traversing = navigation?.activation?.navigationType === 'traverse' ||
      performance.getEntriesByType('navigation')[0]?.type === 'back_forward'
    if (!isListing() || !(returning || traversing)) return
    let position
    try { position = JSON.parse(session.get(POSITION_PREFIX + location.pathname)) } catch { return }
    if (!position) return
    document.querySelectorAll('[data-carousel-track]').forEach((track, i) => {
      if (position.tracks?.[i]) track.scrollTo({ left: position.tracks[i], behavior: 'instant' })
    })
    scrollerOf()?.scrollTo({ top: position.top || 0, behavior: 'instant' })
  }
  // Browsers without pagereveal: restore once the DOM is ready
  if (!('onpagereveal' in window)) document.addEventListener('DOMContentLoaded', restoreListingPosition)
})()
